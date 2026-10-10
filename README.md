# University Research Opportunity Portal

A web application for browsing and managing university research opportunities. The project uses a Flask REST API, a MySQL database, and an HTML/CSS/JavaScript frontend. Postman is used to test the API endpoints.

## Features

- View available research opportunities
- Create a new research opportunity
- Retrieve all opportunities or one opportunity by ID
- Update an opportunity
- Delete an opportunity
- Test API endpoints with Postman

## Technologies Used

- Python
- Flask
- MySQL
- `mysql-connector-python`
- `python-dotenv`
- HTML, CSS, JavaScript
- Postman

## Project Structure

```text
research-opportunity-portal/
├── app.py
├── schema.sql
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   └── script.js
└── postman/
    └── University_Research_Opportunity_Portal_API.postman_collection.json
```

The `postman/` folder and its collection file should be present in your project. The real `.env` file contains local configuration and should not be uploaded to GitHub.

## Requirements

- Python 3
- MySQL Server
- Postman (for API testing)

## Setup Instructions

### 1. Clone or open the project

If you have cloned the project from GitHub:

```bash
git clone https://github.com/YOUR-USERNAME/research-opportunity-portal.git
cd research-opportunity-portal
```

Otherwise, open your existing project folder in VS Code.

### 2. Create and activate a virtual environment

On macOS or Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure MySQL

Start your MySQL server. Create the database and table by running the SQL commands in `schema.sql`. For example, if your MySQL command-line client is available:

```bash
mysql -u root -p < schema.sql
```

The exact command may differ depending on your MySQL installation and port configuration.

Copy `.env.example` to `.env` and edit the values to match your local MySQL configuration. For example:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=research_portal
```

Use your actual local database username, password, and port. Never commit the real `.env` file to GitHub.

### 5. Run the Flask application

Make sure your virtual environment is activated and MySQL is running, then execute:

```bash
python app.py
```

Open the website at:

```text
http://127.0.0.1:5000/
```

## API Endpoints

The API base URL for local development is `http://127.0.0.1:5000`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/opportunities` | Retrieve all opportunities |
| GET | `/api/opportunities/<id>` | Retrieve one opportunity by ID |
| POST | `/api/opportunities` | Create an opportunity |
| PUT | `/api/opportunities/<id>` | Update an opportunity |
| DELETE | `/api/opportunities/<id>` | Delete an opportunity |

For POST and PUT requests, send JSON with the required opportunity fields, including `title`, `description`, `research_area`, `faculty_name`, `department`, `required_skills`, `positions`, and `deadline`. The `status` field can be `Open` or `Closed`.

## Testing with Postman

1. Start MySQL and run the Flask application.
2. Import the Postman collection JSON file from the `postman/` directory.
3. Send a POST request to create a test opportunity and note its returned ID.
4. Use GET to retrieve all opportunities and the new record by ID.
5. Use PUT to update the test record.
6. Use DELETE to delete the test record.
7. Use GET on the deleted ID to verify that the API returns `404 Not Found`.

Use a disposable test opportunity for deletion so that important records are not removed accidentally. Ensure all requests that use an ID point to an opportunity that exists.

## Security Notes

- Do not upload `.env` or passwords to GitHub.
- Use a dedicated database account and a strong password for non-local deployments.
- This project is intended for local development and educational use unless further deployment and security configuration is added.
