# Postman API Testing

This folder contains the Postman collection for testing the University Research Opportunity Portal REST API.

## Base URL

`http://127.0.0.1:5000`

## API Test Cases

| Operation | Method | Endpoint |
|---|---|---|
| Create opportunity | POST | `/api/opportunities` |
| Get all opportunities | GET | `/api/opportunities` |
| Get opportunity by ID | GET | `/api/opportunities/:id` |
| Update opportunity | PUT | `/api/opportunities/:id` |
| Delete opportunity | DELETE | `/api/opportunities/:id` |
| Verify deletion | GET | `/api/opportunities/:id` |

## How to Run the Tests

1. Start the Flask backend and ensure MySQL is running.
2. Import the Postman collection into Postman.
3. Send a POST request to create a test opportunity.
4. Use the returned opportunity ID for the GET, PUT, and DELETE requests.
5. Verify that the deleted opportunity returns a 404 Not Found response.

POST and PUT requests use JSON request bodies. Use a test record when checking the DELETE endpoint.

## Technologies

- Python and Flask
- MySQL
- REST API
- Postman