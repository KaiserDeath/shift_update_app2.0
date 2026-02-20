from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from datetime import datetime
import uuid
from urllib.parse import unquote

app = Flask(__name__)
CORS(app)

# =============================
# DATABASE CONFIG
# =============================
DATABASE_CONFIG = {
    "dbname": "incidents_db",
    "user": "postgres",
    "password": "Back12345",
    "host": "localhost",
    "port": "5432"
}

def get_connection():
    return psycopg2.connect(**DATABASE_CONFIG)

# =============================
# INIT DATABASE
# =============================
def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE
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
    conn.close()

init_db()

# =============================
# COMPANIES
# =============================
@app.route("/companies", methods=["GET"])
def get_companies():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM companies ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([row[0] for row in rows])


@app.route("/companies", methods=["POST"])
def add_company():
    data = request.json
    name = (data.get("name") or "").strip()

    if not name:
        return jsonify({"error": "Name required"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO companies (name)
        VALUES (%s)
        ON CONFLICT (name) DO NOTHING
    """, (name,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Company added"})


@app.route("/companies/<path:name>", methods=["DELETE"])
def delete_company(name):
    name = unquote(name).strip()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM incidents WHERE company = %s", (name,))
    count = cursor.fetchone()[0]

    if count > 0:
        conn.close()
        return jsonify({"error": "IN_USE"}), 400

    cursor.execute("DELETE FROM companies WHERE name = %s", (name,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Company deleted"})

# =============================
# CATEGORIES
# =============================
@app.route("/categories", methods=["GET"])
def get_categories():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM categories ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([row[0] for row in rows])


@app.route("/categories", methods=["POST"])
def add_category():
    data = request.json
    name = (data.get("name") or "").strip()

    if not name:
        return jsonify({"error": "Name required"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO categories (name)
        VALUES (%s)
        ON CONFLICT (name) DO NOTHING
    """, (name,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Category added"})


@app.route("/categories/<path:name>", methods=["DELETE"])
def delete_category(name):
    name = unquote(name).strip()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM incidents WHERE category = %s", (name,))
    count = cursor.fetchone()[0]

    if count > 0:
        conn.close()
        return jsonify({"error": "IN_USE"}), 400

    cursor.execute("DELETE FROM categories WHERE name = %s", (name,))
    conn.commit()
    conn.close()

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
    conn.close()

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


# CREATE
@app.route("/incidents", methods=["POST"])
def create_incident():
    data = request.json
    incident_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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
    conn.close()

    return jsonify({"message": "Incident created"})


# FULL EDIT (updates timestamp)
@app.route("/incidents/<incident_id>", methods=["PUT"])
def update_incident(incident_id):
    data = request.json
    new_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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
    conn.close()

    return jsonify({"message": "Incident updated"})


# STATUS ONLY (NEW ROUTE - DOES NOT CHANGE TIMESTAMP)
@app.route("/incidents/<incident_id>/status", methods=["PATCH"])
def update_status_only(incident_id):
    data = request.json
    new_status = data.get("status")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE incidents
        SET status = %s
        WHERE id = %s
    """, (new_status, incident_id))

    conn.commit()
    conn.close()

    return jsonify({"message": "Status updated"})


@app.route("/incidents/<incident_id>", methods=["DELETE"])
def delete_incident(incident_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM incidents WHERE id = %s", (incident_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Incident deleted"})


if __name__ == "__main__":
    app.run(debug=True)
