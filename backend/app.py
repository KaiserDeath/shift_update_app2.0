from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
import uuid
from urllib.parse import unquote

app = Flask(__name__)
CORS(app)

DATABASE = "incidents.db"

# =============================
# INIT DATABASE
# =============================
def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        cursor.execute("INSERT OR IGNORE INTO companies (name) VALUES (?)", (company,))

    default_categories = [
        "Depositos",
        "Cashouts",
        "Bonos",
        "Glitches",
        "Freeplay"
    ]

    for category in default_categories:
        cursor.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (category,))

    conn.commit()
    conn.close()

init_db()

# =============================
# COMPANIES
# =============================
@app.route("/companies", methods=["GET"])
def get_companies():
    conn = sqlite3.connect(DATABASE)
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

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO companies (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Company added"})


@app.route("/companies/<path:name>", methods=["DELETE"])
def delete_company(name):
    name = unquote(name).strip()

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM incidents WHERE company = ?", (name,))
    count = cursor.fetchone()[0]

    if count > 0:
        conn.close()
        return jsonify({"error": "IN_USE"}), 400

    cursor.execute("DELETE FROM companies WHERE name = ?", (name,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Company deleted"})


# =============================
# CATEGORIES
# =============================
@app.route("/categories", methods=["GET"])
def get_categories():
    conn = sqlite3.connect(DATABASE)
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

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Category added"})


@app.route("/categories/<path:name>", methods=["DELETE"])
def delete_category(name):
    name = unquote(name).strip()

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM incidents WHERE category = ?", (name,))
    count = cursor.fetchone()[0]

    if count > 0:
        conn.close()
        return jsonify({"error": "IN_USE"}), 400

    cursor.execute("DELETE FROM categories WHERE name = ?", (name,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Category deleted"})


# =============================
# INCIDENTS
# =============================
@app.route("/incidents", methods=["GET"])
def get_incidents():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, timestamp, shift, category, company,
               description, action_taken, status, operator
        FROM incidents
        ORDER BY timestamp DESC
    """)

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


@app.route("/incidents", methods=["POST"])
def create_incident():
    data = request.json

    incident_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO incidents
        (id, timestamp, shift, category, company,
         description, action_taken, status, operator)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    return jsonify({
        "id": incident_id,
        "timestamp": timestamp,
        "shift": data.get("shift"),
        "category": data.get("category"),
        "company": data.get("company"),
        "description": data.get("description"),
        "action_taken": data.get("action_taken"),
        "status": data.get("status", "Pending"),
        "operator": data.get("operator")
    })


# 🔥 FIXED UPDATE ROUTE (Only structural change)
@app.route("/incidents/<incident_id>", methods=["PUT"])
def update_incident(incident_id):
    data = request.json

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    new_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        UPDATE incidents
        SET timestamp = ?,
            shift = ?,
            category = ?,
            company = ?,
            description = ?,
            action_taken = ?,
            status = ?,
            operator = ?
        WHERE id = ?
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


@app.route("/incidents/<incident_id>", methods=["DELETE"])
def delete_incident(incident_id):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM incidents WHERE id = ?", (incident_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Incident deleted"})


if __name__ == "__main__":
    app.run(debug=True)
