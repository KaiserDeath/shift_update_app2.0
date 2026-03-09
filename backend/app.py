from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.pool
import bcrypt
from datetime import datetime
import uuid
from urllib.parse import unquote
import re
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# =============================
# ENHANCED CORS CONFIGURATION
# =============================
CORS(
    app,
    resources={r"/*": {
        "origins": [
            "https://shift-update-app2-0.vercel.app",
            "https://shiftupdateapp20-production.up.railway.app",
            "http://localhost:5173"
        ],
        "allow_headers": ["Content-Type", "Username", "Role", "Authorization"],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "supports_credentials": True
    }}
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
# ROLE PROTECTION (FIXED FOR CORS)
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
            cursor.execute("SELECT role FROM users WHERE username = %s", (username,))
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

    # Base Tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            group_name TEXT DEFAULT '',
            information TEXT DEFAULT '{}'
        )
    """)
    cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS group_name TEXT DEFAULT ''")
    cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS information TEXT DEFAULT '{}'")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        )
    """)
    # --- ADD PRIVATE COLUMN ---
    cursor.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS private BOOLEAN DEFAULT FALSE")

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
            operator TEXT,
            resolution TEXT DEFAULT ''
        )
    """)
    cursor.execute("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolution TEXT DEFAULT ''")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin','supervisor','operator'))
        )
    """)

    default_companies = ["Play Play Play", "Lucky Lady", "WiseGang", "Ballerz", "Fast Fortunes"]
    for company in default_companies:
        cursor.execute("INSERT INTO companies (name) VALUES (%s) ON CONFLICT (name) DO NOTHING", (company,))

    default_categories = ["Depositos", "Cashouts", "Bonos", "Glitches", "Freeplay"]
    for category in default_categories:
        cursor.execute("INSERT INTO categories (name) VALUES (%s) ON CONFLICT (name) DO NOTHING", (category,))

    conn.commit()
    cursor.close()
    release_connection(conn)

init_db()

# =============================
# ADMIN CREATE USER
# =============================
@app.route("/admin/create-user", methods=["POST", "OPTIONS"])
def create_user():
    if request.method == "OPTIONS": return "", 200
    data = request.json
    admin_username = data.get("admin_username")
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    
    if not all([admin_username, username, password, role]):
        return jsonify({"error": "All fields required"}), 400
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT role FROM users WHERE username = %s", (admin_username,))
    admin = cursor.fetchone()
    if not admin or admin[0] != "admin":
        cursor.close()
        release_connection(conn)
        return jsonify({"error": "Only admin can create users"}), 403
        
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    try:
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s)", (username, password_hash, role))
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
    cursor.execute("SELECT name, group_name, information FROM companies ORDER BY name ASC")
    rows = cursor.fetchall()
    cursor.close()
    release_connection(conn)
    
    return jsonify([{"name": row[0], "group_name": row[1], "information": row[2]} for row in rows])

@app.route("/companies", methods=["POST", "OPTIONS"])
@require_role(["admin", "supervisor"])
def add_company():
    if request.method == "OPTIONS": return "", 200
    data = request.json
    name = (data.get("name") or "").strip()
    group = (data.get("group_name") or "").strip()
    info = (data.get("information") or "{}")

    if not is_valid_name(name):
        return jsonify({"error": "Invalid company name"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO companies (name, group_name, information) VALUES (%s, %s, %s)", (name, group, info))
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        cursor.close()
        release_connection(conn)
        return jsonify({"error": "Company already exists"}), 400
    cursor.close()
    release_connection(conn)
    return jsonify({"message": "Company added", "name": name})

@app.route("/companies/<path:name>/info", methods=["PATCH", "OPTIONS"])
@require_role(["admin", "supervisor"])
def update_company_info(name):
    if request.method == "OPTIONS": return "", 200
    name = unquote(name).strip()
    data = request.json
    info = data.get("information", "{}")
    group = data.get("group_name", "")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE companies SET information = %s, group_name = %s WHERE name = %s", (info, group, name))
    conn.commit()
    cursor.close()
    release_connection(conn)
    return jsonify({"message": "Info updated"})

@app.route("/companies/<path:name>", methods=["DELETE", "OPTIONS"])
@require_role(["admin", "supervisor"])
def delete_company(name):
    if request.method == "OPTIONS": return "", 200
    name = unquote(name).strip()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM incidents WHERE company = %s", (name,))
    if cursor.fetchone()[0] > 0:
        cursor.close()
        release_connection(conn)
        return jsonify({"error": "IN_USE"}), 400
    cursor.execute("DELETE FROM companies WHERE name = %s", (name,))
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
    cursor.execute("SELECT name, private FROM categories ORDER BY name ASC")
    rows = cursor.fetchall()
    cursor.close()
    release_connection(conn)
    return jsonify([{"name": row[0], "private": row[1]} for row in rows])

@app.route("/categories", methods=["POST", "OPTIONS"])
@require_role(["admin", "supervisor"])
def add_category():
    if request.method == "OPTIONS": return "", 200
    data = request.json
    name = (data.get("name") or "").strip()
    private = data.get("private", False)
    if not is_valid_name(name):
        return jsonify({"error": "Invalid category name"}), 400
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO categories (name, private) VALUES (%s, %s)", (name, private))
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        cursor.close()
        release_connection(conn)
        return jsonify({"error": "Category already exists"}), 400
    cursor.close()
    release_connection(conn)
    return jsonify({"message": "Category added", "category": {"name": name, "private": private}})

@app.route("/categories/<path:name>", methods=["DELETE", "OPTIONS"])
@require_role(["admin", "supervisor"])
def delete_category(name):
    if request.method == "OPTIONS": return "", 200
    name = unquote(name).strip()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM incidents WHERE category = %s", (name,))
    if cursor.fetchone()[0] > 0:
        cursor.close()
        release_connection(conn)
        return jsonify({"error": "IN_USE"}), 400
    cursor.execute("DELETE FROM categories WHERE name = %s", (name,))
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
    role = request.headers.get("Role")  # <-- NEW: get Role from frontend

    conn = get_connection()
    cursor = conn.cursor()

    # Fetch categories with privacy info
    cursor.execute("SELECT name, private FROM categories")
    categories = {name: private for name, private in cursor.fetchall()}

    # Base query
    query = "SELECT id, timestamp, shift, category, company, description, action_taken, status, operator, resolution FROM incidents WHERE 1=1"
    params = []

    if company: query += " AND company = %s"; params.append(company)
    if category: query += " AND category = %s"; params.append(category)
    if shift: query += " AND shift = %s"; params.append(shift)
    if status: query += " AND status = %s"; params.append(status)
    if operator: query += " AND operator = %s"; params.append(operator)
    if search:
        query += " AND (description ILIKE %s OR action_taken ILIKE %s)"; params.append(f"%{search}%"); params.append(f"%{search}%")
    if date_from: query += " AND timestamp >= %s"; params.append(f"{date_from} 00:00:00")
    if date_to: query += " AND timestamp <= %s"; params.append(f"{date_to} 23:59:59")

    # Filter private categories for operators
    if role == "operator":
        private_cats = [name for name, private in categories.items() if private]
        if private_cats:
            placeholders = ",".join(["%s"]*len(private_cats))
            query += f" AND category NOT IN ({placeholders})"
            params.extend(private_cats)

    query += " ORDER BY timestamp DESC"
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    cursor.close()
    release_connection(conn)

    return jsonify([
        {"id": r[0], "timestamp": r[1], "shift": r[2], "category": r[3], "company": r[4],
         "description": r[5], "action_taken": r[6], "status": r[7], "operator": r[8], "resolution": r[9]}
        for r in rows
    ])

# =============================
# OTHER INCIDENT ROUTES
# =============================
@app.route("/incidents", methods=["POST", "OPTIONS"])
def create_incident():
    if request.method == "OPTIONS": return "", 200
    data = request.json
    required = ["shift", "category", "company", "description", "operator"]
    for f in required:
        if not data.get(f): return jsonify({"error": f"{f} is required"}), 400
        
    incident_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO incidents (id, timestamp, shift, category, company, description, action_taken, status, operator, resolution) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (incident_id, timestamp, data.get("shift"), data.get("category"), data.get("company"), data.get("description"),
         data.get("action_taken"), data.get("status", "Pending"), data.get("operator"), ""))
    conn.commit()
    cursor.close()
    release_connection(conn)
    return jsonify({"id": incident_id, "timestamp": timestamp, **data})

@app.route("/incidents/<incident_id>", methods=["PUT", "OPTIONS"])
def update_incident(incident_id):
    if request.method == "OPTIONS": return "", 200
    data = request.json
    new_ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE incidents SET timestamp=%s, shift=%s, category=%s, company=%s, description=%s, action_taken=%s, status=%s, operator=%s WHERE id=%s",
        (new_ts, data.get("shift"), data.get("category"), data.get("company"), data.get("description"),
         data.get("action_taken"), data.get("status"), data.get("operator"), incident_id))
    conn.commit()
    cursor.close()
    release_connection(conn)
    return jsonify({"message": "Incident updated"})

@app.route("/incidents/<incident_id>/status", methods=["PATCH", "OPTIONS"])
def update_status_only(incident_id):
    if request.method == "OPTIONS": return "", 200
    data = request.json
    status = data.get("status")
    resolution = data.get("resolution", "")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE incidents SET status=%s, resolution=%s WHERE id=%s", (status, resolution, incident_id))
    conn.commit()
    cursor.close()
    release_connection(conn)
    return jsonify({"message": "Status updated"})

@app.route("/incidents/<incident_id>", methods=["DELETE", "OPTIONS"])
def delete_incident(incident_id):
    if request.method == "OPTIONS": return "", 200
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM incidents WHERE id=%s", (incident_id,))
    conn.commit()
    cursor.close()
    release_connection(conn)
    return jsonify({"message": "Incident deleted"})

# =============================
# LOGIN
# =============================
@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS": return "", 200
    data = request.json
    username = data.get("username")
    password = data.get("password")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, password_hash, role FROM users WHERE username=%s", (username,))
    user = cursor.fetchone()
    cursor.close()
    release_connection(conn)
    if not user or not bcrypt.checkpw(password.encode(), user[1].encode()):
        return jsonify({"error": "Invalid credentials"}), 401
    return jsonify({"user_id": user[0], "username": username, "role": user[2]})

# =============================
# ADMIN USERS
# =============================
@app.route("/admin/users", methods=["GET"])
@require_role(["admin"])
def get_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, role FROM users ORDER BY username ASC")
    rows = cursor.fetchall()
    cursor.close()
    release_connection(conn)
    return jsonify([{"username": r[0], "role": r[1]} for r in rows])

@app.route("/admin/users/<username>/password", methods=["PATCH", "OPTIONS"])
@require_role(["admin"])
def reset_user_password(username):
    if request.method == "OPTIONS": return "", 200
    data = request.json
    new_pass = data.get("password")
    if not new_pass: return jsonify({"error": "Password is required"}), 400
    pw_hash = bcrypt.hashpw(new_pass.encode(), bcrypt.gensalt()).decode()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password_hash=%s WHERE username=%s", (pw_hash, username))
    conn.commit()
    cursor.close()
    release_connection(conn)
    return jsonify({"message": "Password updated"})

@app.route("/admin/users/<username>/role", methods=["PATCH", "OPTIONS"])
@require_role(["admin"])
def update_user_role(username):
    if request.method == "OPTIONS": return "", 200
    data = request.json
    new_role = data.get("role")
    if new_role not in ["admin", "supervisor", "operator"]:
        return jsonify({"error": "Invalid role"}), 400
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role=%s WHERE username=%s", (new_role, username))
    conn.commit()
    cursor.close()
    release_connection(conn)
    return jsonify({"message": "Role updated"})

@app.route("/admin/users/<username>", methods=["DELETE", "OPTIONS"])
@require_role(["admin"])
def delete_user(username):
    if request.method == "OPTIONS": return "", 200
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE username=%s", (username,))
    conn.commit()
    cursor.close()
    release_connection(conn)
    return jsonify({"message": "User deleted"})

@app.route("/")
def home():
    return jsonify({"message": "Backend is running"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)