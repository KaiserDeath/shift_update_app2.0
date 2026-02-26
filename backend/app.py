from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.pool
import bcrypt
from datetime import datetime, timezone
import uuid
from urllib.parse import unquote
import re
import os

app = Flask(__name__)

CORS(
    app,
    origins=[
        "https://shiftupdateapp20-production.up.railway.app",
        "https://shift-update-app2-0.vercel.app",
        "http://localhost:5173"
    ],
    allow_headers=["Content-Type", "Username", "Role"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
)

# =============================
# DATABASE POOL CONFIG
# =============================

DATABASE_URL = os.environ["DATABASE_URL"]

connection_pool = psycopg2.pool.SimpleConnectionPool(
    minconn=1,
    maxconn=5,
    dsn=DATABASE_URL
)

def get_connection():
    return connection_pool.getconn()

def release_connection(conn):
    connection_pool.putconn(conn)

# =============================
# VALIDATION
# =============================

def is_valid_name(name):
    if not name:
        return False
    name = name.strip()
    if len(name) < 2 or len(name) > 50:
        return False
    if not re.search(r'[A-Za-z0-9]', name):
        return False
    if not re.fullmatch(r'[A-Za-z0-9 _-]+', name):
        return False
    return True

# =============================
# ROLE PROTECTION
# =============================

def require_role(allowed_roles):
    def decorator(func):
        def wrapper(*args, **kwargs):

            if request.method == "OPTIONS":
                return "", 200

            username = request.headers.get("Username")

            if not username:
                return jsonify({"error": "Username required"}), 403

            conn = get_connection()
            cursor = conn.cursor()

            cursor.execute(
                "SELECT role FROM users WHERE username = %s",
                (username,)
            )

            result = cursor.fetchone()

            cursor.close()
            release_connection(conn)

            if not result:
                return jsonify({"error": "User not found"}), 403

            user_role = result[0]

            if user_role not in allowed_roles:
                return jsonify({"error": "Unauthorized"}), 403

            return func(*args, **kwargs)

        wrapper.__name__ = func.__name__
        return wrapper
    return decorator

# =============================
# INIT DATABASE
# =============================

def init_db():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            shift TEXT,
            category TEXT,
            company TEXT,
            description TEXT,
            action_taken TEXT,
            status TEXT,
            operator TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin','supervisor','operator'))
        )
    """)

    default_companies = [
        "Play Play Play",
        "Lucky Lady",
        "WiseGang",
        "Ballerz",
        "Fast Fortunes"
    ]

    for company in default_companies:
        cursor.execute("""
            INSERT INTO companies (name)
            VALUES (%s)
            ON CONFLICT (name) DO NOTHING
        """, (company,))

    default_categories = [
        "Depositos",
        "Cashouts",
        "Bonos",
        "Glitches",
        "Freeplay"
    ]

    for category in default_categories:
        cursor.execute("""
            INSERT INTO categories (name)
            VALUES (%s)
            ON CONFLICT (name) DO NOTHING
        """, (category,))

    conn.commit()
    cursor.close()
    release_connection(conn)

init_db()

# =============================
# ADMIN CREATE USER
# =============================

@app.route("/admin/create-user", methods=["POST"])
def create_user():

    data = request.json

    admin_username = data.get("admin_username")
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not all([admin_username, username, password, role]):
        return jsonify({"error": "All fields required"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT role FROM users WHERE username = %s",
        (admin_username,)
    )

    admin = cursor.fetchone()

    if not admin or admin[0] != "admin":
        cursor.close()
        release_connection(conn)
        return jsonify({"error": "Only admin can create users"}), 403

    password_hash = bcrypt.hashpw(
        password.encode(),
        bcrypt.gensalt()
    ).decode()

    try:

        cursor.execute("""
            INSERT INTO users (username, password_hash, role)
            VALUES (%s, %s, %s)
        """, (username, password_hash, role))

        conn.commit()

    except psycopg2.errors.UniqueViolation:

        conn.rollback()
        cursor.close()
        release_connection(conn)

        return jsonify({"error": "Username already exists"}), 400

    cursor.close()
    release_connection(conn)

    return jsonify({"message": "User created"})

# =============================
# COMPANIES
# =============================

@app.route("/companies", methods=["GET"])
def get_companies():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM companies ORDER BY name ASC")

    rows = cursor.fetchall()

    cursor.close()
    release_connection(conn)

    return jsonify([row[0] for row in rows])


@app.route("/companies", methods=["POST"])
@require_role(["admin", "supervisor"])
def add_company():

    data = request.json
    name = (data.get("name") or "").strip()

    if not is_valid_name(name):
        return jsonify({"error": "Invalid company name"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "INSERT INTO companies (name) VALUES (%s)",
            (name,)
        )

        conn.commit()

    except psycopg2.errors.UniqueViolation:

        conn.rollback()

        cursor.close()
        release_connection(conn)

        return jsonify({"error": "Company already exists"}), 400

    cursor.close()
    release_connection(conn)

    return jsonify({"message": "Company added"})


@app.route("/companies/<path:name>", methods=["DELETE"])
@require_role(["admin", "supervisor"])
def delete_company(name):

    name = unquote(name).strip()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM incidents WHERE company = %s",
        (name,)
    )

    count = cursor.fetchone()[0]

    if count > 0:

        cursor.close()
        release_connection(conn)

        return jsonify({"error": "IN_USE"}), 400

    cursor.execute(
        "DELETE FROM companies WHERE name = %s",
        (name,)
    )

    conn.commit()

    cursor.close()
    release_connection(conn)

    return jsonify({"message": "Company deleted"})

# =============================
# CATEGORIES
# =============================

@app.route("/categories", methods=["GET"])
def get_categories():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT name FROM categories ORDER BY name ASC"
    )

    rows = cursor.fetchall()

    cursor.close()
    release_connection(conn)

    return jsonify([row[0] for row in rows])


@app.route("/categories", methods=["POST"])
@require_role(["admin", "supervisor"])
def add_category():

    data = request.json
    name = (data.get("name") or "").strip()

    if not is_valid_name(name):
        return jsonify({"error": "Invalid category name"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "INSERT INTO categories (name) VALUES (%s)",
            (name,)
        )

        conn.commit()

    except psycopg2.errors.UniqueViolation:

        conn.rollback()

        cursor.close()
        release_connection(conn)

        return jsonify({"error": "Category already exists"}), 400

    cursor.close()
    release_connection(conn)

    return jsonify({"message": "Category added"})


@app.route("/categories/<path:name>", methods=["DELETE"])
@require_role(["admin", "supervisor"])
def delete_category(name):

    name = unquote(name).strip()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM incidents WHERE category = %s",
        (name,)
    )

    count = cursor.fetchone()[0]

    if count > 0:

        cursor.close()
        release_connection(conn)

        return jsonify({"error": "IN_USE"}), 400

    cursor.execute(
        "DELETE FROM categories WHERE name = %s",
        (name,)
    )

    conn.commit()

    cursor.close()
    release_connection(conn)

    return jsonify({"message": "Category deleted"})

# =============================
# INCIDENTS
# =============================

@app.route("/incidents", methods=["GET"])
def get_incidents():

    company = request.args.get("company")
    category = request.args.get("category")
    search = request.args.get("search")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    shift = request.args.get("shift")
    status = request.args.get("status")
    operator = request.args.get("operator")

    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT id, timestamp, shift, category, company,
               description, action_taken, status, operator
        FROM incidents
        WHERE 1=1
    """

    params = []

    if company:
        query += " AND company = %s"
        params.append(company)

    if category:
        query += " AND category = %s"
        params.append(category)

    if shift:
        query += " AND shift = %s"
        params.append(shift)

    if status:
        query += " AND status = %s"
        params.append(status)

    if operator:
        query += " AND operator = %s"
        params.append(operator)

    if search:
        query += " AND (description ILIKE %s OR action_taken ILIKE %s)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")

    if date_from:
        query += " AND timestamp >= %s"
        params.append(f"{date_from} 00:00:00")

    if date_to:
        query += " AND timestamp <= %s"
        params.append(f"{date_to} 23:59:59")

    query += " ORDER BY timestamp DESC"

    cursor.execute(query, tuple(params))

    rows = cursor.fetchall()

    cursor.close()
    release_connection(conn)

    incidents = []

    for row in rows:

        incidents.append({
            "id": row[0],
            "timestamp": row[1],
            "shift": row[2],
            "category": row[3],
            "company": row[4],
            "description": row[5],
            "action_taken": row[6],
            "status": row[7],
            "operator": row[8]
        })

    return jsonify(incidents)


@app.route("/incidents", methods=["POST"])
def create_incident():

    data = request.json

    required_fields = [
        "shift",
        "category",
        "company",
        "description",
        "operator"
    ]

    for field in required_fields:

        if not data.get(field):

            return jsonify({
                "error": f"{field} is required"
            }), 400

    incident_id = str(uuid.uuid4())

    timestamp = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO incidents
        (id, timestamp, shift, category, company,
         description, action_taken, status, operator)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        incident_id,
        timestamp,
        data.get("shift"),
        data.get("category"),
        data.get("company"),
        data.get("description"),
        data.get("action_taken"),
        data.get("status", "Pending"),
        data.get("operator")
    ))

    conn.commit()

    cursor.close()
    release_connection(conn)

    return jsonify({
        "id": incident_id,
        "timestamp": timestamp,
        **data
    })


@app.route("/incidents/<incident_id>", methods=["PUT"])
def update_incident(incident_id):

    data = request.json

    new_timestamp = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE incidents
        SET timestamp = %s,
            shift = %s,
            category = %s,
            company = %s,
            description = %s,
            action_taken = %s,
            status = %s,
            operator = %s
        WHERE id = %s
    """, (
        new_timestamp,
        data.get("shift"),
        data.get("category"),
        data.get("company"),
        data.get("description"),
        data.get("action_taken"),
        data.get("status"),
        data.get("operator"),
        incident_id
    ))

    conn.commit()

    cursor.close()
    release_connection(conn)

    return jsonify({
        "message": "Incident updated"
    })


@app.route("/incidents/<incident_id>/status", methods=["PATCH"])
def update_status_only(incident_id):

    data = request.json
    new_status = data.get("status")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE incidents SET status = %s WHERE id = %s",
        (new_status, incident_id)
    )

    conn.commit()

    cursor.close()
    release_connection(conn)

    return jsonify({
        "message": "Status updated"
    })


@app.route("/incidents/<incident_id>", methods=["DELETE"])
def delete_incident(incident_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM incidents WHERE id = %s",
        (incident_id,)
    )

    conn.commit()

    cursor.close()
    release_connection(conn)

    return jsonify({
        "message": "Incident deleted"
    })

# =============================
# LOGIN
# =============================

@app.route("/login", methods=["POST"])
def login():

    data = request.json

    username = data.get("username")
    password = data.get("password")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, password_hash, role FROM users WHERE username = %s",
        (username,)
    )

    user = cursor.fetchone()

    cursor.close()
    release_connection(conn)

    if not user:

        return jsonify({
            "error": "Invalid credentials"
        }), 401

    user_id, password_hash, role = user

    if not bcrypt.checkpw(
        password.encode(),
        password_hash.encode()
    ):

        return jsonify({
            "error": "Invalid credentials"
        }), 401

    return jsonify({
        "user_id": user_id,
        "username": username,
        "role": role
    })

# =============================
# ADMIN USERS
# =============================

@app.route("/admin/users", methods=["GET"])
@require_role(["admin"])
def get_users():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT username, role FROM users ORDER BY username ASC"
    )

    rows = cursor.fetchall()

    cursor.close()
    release_connection(conn)

    users = []

    for row in rows:

        users.append({
            "username": row[0],
            "role": row[1]
        })

    return jsonify(users)


@app.route("/admin/users/<username>/password", methods=["PATCH"])
@require_role(["admin"])
def reset_user_password(username):

    data = request.json

    new_password = data.get("password")

    if not new_password:

        return jsonify({
            "error": "Password is required"
        }), 400

    password_hash = bcrypt.hashpw(
        new_password.encode(),
        bcrypt.gensalt()
    ).decode()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE users SET password_hash = %s WHERE username = %s",
        (password_hash, username)
    )

    conn.commit()

    cursor.close()
    release_connection(conn)

    return jsonify({
        "message": "Password updated successfully"
    })


@app.route("/admin/users/<username>/role", methods=["PATCH"])
@require_role(["admin"])
def update_user_role(username):

    data = request.json

    new_role = data.get("role")

    if new_role not in ["admin", "supervisor", "operator"]:

        return jsonify({
            "error": "Invalid role"
        }), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE users SET role = %s WHERE username = %s",
        (new_role, username)
    )

    conn.commit()

    cursor.close()
    release_connection(conn)

    return jsonify({
        "message": "Role updated successfully"
    })


@app.route("/admin/users/<username>", methods=["DELETE"])
@require_role(["admin"])
def delete_user(username):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM users WHERE username = %s",
        (username,)
    )

    conn.commit()

    cursor.close()
    release_connection(conn)

    return jsonify({
        "message": "User deleted"
    })

# =============================
# HOME
# =============================

@app.route("/")
def home():
    return jsonify({
        "message": "Backend is running"
    })

# =============================
# RUN
# =============================

if __name__ == "__main__":

    port = int(
        os.environ.get("PORT", 5000)
    )

    app.run(
        host="0.0.0.0",
        port=port
    )