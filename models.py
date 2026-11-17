from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(64), default="Member / Student")
    bio = db.Column(db.String(500), default="born cool like that")
    avatar_url = db.Column(db.String(2048), nullable=True)
    banner_url = db.Column(db.String(2048), nullable=True)
    followers_count = db.Column(db.Integer, default=0)
    following_count = db.Column(db.Integer, default=0)


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(255))
    content = db.Column(db.Text)
    likes = db.Column(db.Integer, default=0)


class LookbookItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    image_url = db.Column(db.String(2048))
    caption = db.Column(db.String(500))
