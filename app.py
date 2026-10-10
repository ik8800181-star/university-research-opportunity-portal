import os
from datetime import date

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template

load_dotenv()
app = Flask(__name__)

FIELDS = [
    "title",
    "description",
    "research_area",
    "faculty_name",
    "department",
    "required_skills",
    "positions",
    "deadline",
    "status",
]

REQUIRED_FIELDS = FIELDS[:-1]


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3307")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "research_portal"),
    )


def validate_field(field, value):
    if field in (
        "title", "description", "research_area",
        "faculty_name", "department", "required_skills"
    ):
        if not isinstance(value, str) or not value.strip():
            return f"{field} must not be empty"

    elif field == "positions":
        if isinstance(value, bool) or str(value).strip() == "":
            return "positions must be a positive whole number"
        try:
            number = int(value)
            if str(number) != str(value).strip() or number < 1:
                return "positions must be a positive whole number"
        except (TypeError, ValueError):
            return "positions must be a positive whole number"

    elif field == "deadline":
        try:
            date.fromisoformat(value)
        except (TypeError, ValueError):
            return "deadline must use YYYY-MM-DD format"

    elif field == "status":
        if value not in ("Open", "Closed"):
            return "status must be Open or Closed"

    return None


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/opportunities", methods=["GET"])
def get_opportunities():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM opportunities ORDER BY id DESC"
        )
        return jsonify(cursor.fetchall()), 200
    finally:
        cursor.close()
        conn.close()


@app.route("/api/opportunities/<int:opp_id>", methods=["GET"])
def get_opportunity(opp_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM opportunities WHERE id = %s",
            (opp_id,),
        )
        opportunity = cursor.fetchone()

        if opportunity is None:
            return jsonify({"error": "Opportunity not found"}), 404

        return jsonify(opportunity), 200
    finally:
        cursor.close()
        conn.close()


@app.route("/api/opportunities", methods=["POST"])
def create_opportunity():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Send a JSON object"}), 400

    missing = [
        field for field in REQUIRED_FIELDS
        if field not in data or data[field] is None
        or data[field] == ""
    ]
    if missing:
        return jsonify({
            "error": "Missing required fields",
            "fields": missing,
        }), 400

    unknown = set(data) - set(FIELDS)
    if unknown:
        return jsonify({
            "error": "Unknown fields",
            "fields": sorted(unknown),
        }), 400

    values = {}
    for field in REQUIRED_FIELDS:
        error = validate_field(field, data[field])
        if error:
            return jsonify({"error": error}), 400
        values[field] = data[field]

    status = data.get("status", "Open")
    error = validate_field("status", status)
    if error:
        return jsonify({"error": error}), 400
    values["status"] = status

    columns = ", ".join(FIELDS)
    placeholders = ", ".join(["%s"] * len(FIELDS))

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            f"INSERT INTO opportunities ({columns}) "
            f"VALUES ({placeholders})",
            tuple(values[field] for field in FIELDS),
        )
        conn.commit()
        return jsonify({
            "message": "Opportunity created successfully",
            "id": cursor.lastrowid,
        }), 201
    finally:
        cursor.close()
        conn.close()


@app.route("/api/opportunities/<int:opp_id>", methods=["PUT"])
def update_opportunity(opp_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not data:
        return jsonify({
            "error": "Send a JSON object with fields to update"
        }), 400

    unknown = set(data) - set(FIELDS)
    if unknown:
        return jsonify({
            "error": "Unknown fields",
            "fields": sorted(unknown),
        }), 400

    for field, value in data.items():
        error = validate_field(field, value)
        if error:
            return jsonify({"error": error}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id FROM opportunities WHERE id = %s",
            (opp_id,),
        )
        if cursor.fetchone() is None:
            return jsonify({"error": "Opportunity not found"}), 404

        assignments = ", ".join(
            f"{field} = %s" for field in data
        )
        values = []
        for field, value in data.items():
            if field == "positions":
                value = int(value)
            values.append(value)
        values.append(opp_id)

        cursor.execute(
            f"UPDATE opportunities SET {assignments} WHERE id = %s",
            tuple(values),
        )
        conn.commit()
        return jsonify({
            "message": "Opportunity updated successfully"
        }), 200
    finally:
        cursor.close()
        conn.close()


@app.route("/api/opportunities/<int:opp_id>", methods=["DELETE"])
def delete_opportunity(opp_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM opportunities WHERE id = %s",
            (opp_id,),
        )
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Opportunity not found"}), 404

        return jsonify({
            "message": "Opportunity deleted successfully"
        }), 200
    finally:
        cursor.close()
        conn.close()


@app.errorhandler(mysql.connector.Error)
def handle_database_error(error):
    app.logger.error("Database operation failed: %s", error)
    return jsonify({
        "error": "Database operation failed. Check MySQL and configuration."
    }), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)