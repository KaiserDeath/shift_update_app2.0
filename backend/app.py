from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)

DATA_FILE = "incidents.json"


def read_incidents():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w") as f:
            json.dump([], f)
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def write_incidents(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


@app.route("/incidents", methods=["GET"])
def get_incidents():
    incidents = read_incidents()
    return jsonify(incidents)


@app.route("/incidents", methods=["POST"])
def add_incident():
    incidents = read_incidents()
    data = request.json

    new_incident = {
        "id": str(int(incidents[0]["id"]) + 1) if incidents else "1",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "category": data.get("category"),
        "company": data.get("company"),
        "operationCode": data.get("operationCode", ""),
        "description": data.get("description"),
        "actionTaken": data.get("actionTaken"),
        "status": data.get("status", "Pending"),
        "operator": data.get("operator")
    }

    incidents.insert(0, new_incident)
    write_incidents(incidents)

    return jsonify(new_incident), 201


@app.route("/incidents/<id>", methods=["PUT"])
def update_incident(id):
    incidents = read_incidents()
    for incident in incidents:
        if incident["id"] == id:
            incident.update(request.json)
            write_incidents(incidents)
            return jsonify(incident)
    return jsonify({"error": "Not found"}), 404


@app.route("/incidents/<id>", methods=["DELETE"])
def delete_incident(id):
    incidents = read_incidents()
    incidents = [i for i in incidents if i["id"] != id]
    write_incidents(incidents)
    return "", 204


if __name__ == "__main__":
    app.run(debug=True)
