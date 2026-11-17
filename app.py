import os
import re
import unicodedata

import cloudinary
import cloudinary.uploader
from authlib.integrations.flask_client import OAuth
from cloudinary.exceptions import Error as CloudinaryError
from dotenv import load_dotenv
from flask import Flask, flash, redirect, render_template, request, url_for
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from models import LookbookItem, Post, User, db


load_dotenv()

ROLES = ("Member / Student", "Tailor / Designer", "Seller")


def _database_uri():
    database_uri = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
    if not database_uri:
        raise RuntimeError(
            "Set DATABASE_URL (or SUPABASE_DB_URL) to your Supabase PostgreSQL "
            "connection string."
        )
    if database_uri.startswith("postgres://"):
        return database_uri.replace("postgres://", "postgresql+psycopg://", 1)
    if database_uri.startswith("postgresql://"):
        return database_uri.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_uri


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY") or os.urandom(32)
app.config["SQLALCHEMY_DATABASE_URI"] = _database_uri()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

db.init_app(app)

login_manager = LoginManager()
login_manager.login_view = "login"
login_manager.init_app(app)

oauth = OAuth(app)
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


@login_manager.user_loader
def load_user(user_id):
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None
    return db.session.get(User, user_id)


def _clean_username(value):
    ascii_name = (
        unicodedata.normalize("NFKD", value)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )
    username = re.sub(r"[^a-z0-9]+", "_", ascii_name).strip("_")
    return username[:70] or "member"


def _unique_username(name):
    base = _clean_username(name)
    candidate = base
    suffix = 2
    while User.query.filter(func.lower(User.username) == candidate.lower()).first():
        candidate = f"{base}_{suffix}"
        suffix += 1
    return candidate


@app.get("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("profile"))
    return redirect(url_for("login"))


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return render_template("signup.html", roles=ROLES)

    full_name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")
    repeat_password = request.form.get("repeat_password", "")
    role = request.form.get("role", "Member / Student")

    if not full_name or not email or not password:
        flash("Name, email, and password are required.", "error")
        return render_template("signup.html", roles=ROLES), 400
    if password != repeat_password:
        flash("Passwords do not match.", "error")
        return render_template("signup.html", roles=ROLES), 400
    if role not in ROLES:
        flash("Choose a valid account type.", "error")
        return render_template("signup.html", roles=ROLES), 400
    if User.query.filter(func.lower(User.email) == email).first():
        flash("An account with that email already exists.", "error")
        return render_template("signup.html", roles=ROLES), 409

    user = User(
        full_name=full_name,
        username=_unique_username(full_name),
        email=email,
        password_hash=generate_password_hash(password, method="pbkdf2:sha256"),
        role=role,
    )
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        flash("That email or username is already in use. Please try again.", "error")
        return render_template("signup.html", roles=ROLES), 409

    login_user(user)
    return redirect(url_for("profile"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")
    remember = request.form.get("remember") in {"1", "true", "on", "yes"}
    user = User.query.filter(func.lower(User.email) == email).first()

    if user is None or user.password_hash is None:
        flash("Invalid email or password.", "error")
        return render_template("login.html"), 401
    if not check_password_hash(user.password_hash, password):
        flash("Invalid email or password.", "error")
        return render_template("login.html"), 401

    login_user(user, remember=remember)
    return redirect(url_for("profile"))


@app.get("/auth/google")
def google_login():
    if not os.getenv("GOOGLE_CLIENT_ID") or not os.getenv("GOOGLE_CLIENT_SECRET"):
        flash("Google sign-in is not configured.", "error")
        return redirect(url_for("login"))
    return oauth.google.authorize_redirect(url_for("google_callback", _external=True))


@app.get("/auth/google/callback")
def google_callback():
    token = oauth.google.authorize_access_token()
    user_info = token.get("userinfo")
    if not user_info:
        user_info = oauth.google.get("userinfo").json()

    email = (user_info.get("email") or "").strip().lower()
    if not email:
        flash("Google did not provide an email address.", "error")
        return redirect(url_for("login"))

    user = User.query.filter(func.lower(User.email) == email).first()
    if user is None:
        full_name = (user_info.get("name") or email.partition("@")[0]).strip()
        user = User(
            full_name=full_name,
            username=_unique_username(full_name),
            email=email,
            avatar_url=user_info.get("picture"),
        )
        db.session.add(user)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            user = User.query.filter(func.lower(User.email) == email).first()
            if user is None:
                raise

    login_user(user)
    return redirect(url_for("profile"))


@app.get("/profile")
@login_required
def profile():
    posts = (
        Post.query.filter_by(user_id=current_user.id)
        .order_by(Post.id.desc())
        .all()
    )
    lookbook_items = (
        LookbookItem.query.filter_by(user_id=current_user.id)
        .order_by(LookbookItem.id.desc())
        .all()
    )
    return render_template(
        "profile.html",
        user=current_user,
        posts=posts,
        lookbook_items=lookbook_items,
        roles=ROLES,
    )


@app.post("/profile/update")
@login_required
def update_profile():
    full_name = request.form.get("full_name", current_user.full_name).strip()
    username = _clean_username(request.form.get("username", current_user.username))
    bio = request.form.get("bio", current_user.bio).strip()
    role = request.form.get("role", current_user.role)

    if not full_name:
        flash("Name cannot be empty.", "error")
        return redirect(url_for("profile"))
    if len(username) > 80:
        flash("Username must be 80 characters or fewer.", "error")
        return redirect(url_for("profile"))
    if role not in ROLES:
        flash("Choose a valid account type.", "error")
        return redirect(url_for("profile"))
    username_exists = User.query.filter(
        func.lower(User.username) == username.lower(),
        User.id != current_user.id,
    ).first()
    if username_exists:
        flash("That username is already in use.", "error")
        return redirect(url_for("profile"))

    current_user.full_name = full_name
    current_user.username = username
    current_user.bio = bio
    current_user.role = role

    for field, column in (("avatar", "avatar_url"), ("banner", "banner_url")):
        image = request.files.get(field)
        if image and image.filename:
            try:
                result = cloudinary.uploader.upload(image, folder=f"atelier/{field}")
            except CloudinaryError:
                flash(f"Could not upload the {field} image. Please try again.", "error")
                return redirect(url_for("profile"))
            setattr(current_user, column, result["secure_url"])

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        flash("That username is already in use.", "error")
        return redirect(url_for("profile"))

    flash("Your profile has been updated.", "success")
    return redirect(url_for("profile"))


@app.get("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run()
