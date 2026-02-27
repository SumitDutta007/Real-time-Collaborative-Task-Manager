# 🚀 Task Manager API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
All task endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📝 How to Get Your JWT Token

### 1. Sign in through the frontend
1. Start frontend: `npm run dev` (in my-app folder)
2. Start backend: `npm run dev` (in backend folder)
3. Open: http://localhost:3000/auth/signin
4. Sign in with Google
5. Open browser DevTools > Network tab
6. Look for the `/api/auth/sync` request
7. Copy the `token` from the response

### 2. Or use the sync endpoint directly in Postman

**POST** `http://localhost:5000/api/auth/sync`

**Headers:**
```json
Content-Type: application/json
```

**Body:**
```json
{
  "email": "your-email@gmail.com",
  "name": "Your Name",
  "image": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "status": "success",
  "user": {
    "id": "user-uuid",
    "email": "your-email@gmail.com",
    "name": "Your Name",
    "image": "https://example.com/image.jpg"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy the token from the response and use it for all subsequent requests!**

---

## 🔍 API Endpoints

### 1. Create Task

**POST** `/api/tasks`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Complete Phase 4",
  "description": "Implement all task CRUD endpoints",
  "status": "PENDING",
  "assigneeEmail": "teammate@example.com"
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "task": {
      "id": "task-uuid",
      "title": "Complete Phase 4",
      "description": "Implement all task CRUD endpoints",
      "status": "PENDING",
      "creatorId": "your-user-id",
      "assigneeId": null,
      "pendingAssigneeEmail": "teammate@example.com",
      "createdAt": "2026-02-27T10:30:00.000Z",
      "updatedAt": "2026-02-27T10:30:00.000Z",
      "creator": {
        "id": "your-user-id",
        "name": "Your Name",
        "email": "your-email@gmail.com",
        "image": "https://example.com/image.jpg"
      },
      "assignee": null
    }
  }
}
```

---

### 2. Get All Tasks

**GET** `/api/tasks`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters (Optional):**
- `filter=created` - Get only tasks you created
- `filter=assigned` - Get only tasks assigned to you
- `filter=all` - Get all tasks (default)

**Example:**
```
GET http://localhost:5000/api/tasks?filter=created
```

**Response (200):**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "tasks": [
      {
        "id": "task-uuid-1",
        "title": "Complete Phase 4",
        "description": "Implement all task CRUD endpoints",
        "status": "PENDING",
        "creatorId": "your-user-id",
        "assigneeId": null,
        "pendingAssigneeEmail": "teammate@example.com",
        "createdAt": "2026-02-27T10:30:00.000Z",
        "updatedAt": "2026-02-27T10:30:00.000Z",
        "creator": {
          "id": "your-user-id",
          "name": "Your Name",
          "email": "your-email@gmail.com",
          "image": "https://example.com/image.jpg"
        },
        "assignee": null
      },
      {
        "id": "task-uuid-2",
        "title": "Review Pull Request",
        "status": "COMPLETED",
        "creator": {...},
        "assignee": {...}
      }
    ]
  }
}
```

---

### 3. Get Task by ID

**GET** `/api/tasks/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Example:**
```
GET http://localhost:5000/api/tasks/task-uuid-1
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "task": {
      "id": "task-uuid-1",
      "title": "Complete Phase 4",
      "description": "Implement all task CRUD endpoints",
      "status": "PENDING",
      "creator": {...},
      "assignee": {...}
    }
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "message": "Task not found or access denied"
}
```

---

### 4. Update Task

**PUT** `/api/tasks/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (All fields optional):**
```json
{
  "title": "Updated Task Title",
  "description": "Updated description",
  "status": "COMPLETED",
  "assigneeEmail": "newassignee@example.com"
}
```

**Example:**
```
PUT http://localhost:5000/api/tasks/task-uuid-1
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "task": {
      "id": "task-uuid-1",
      "title": "Updated Task Title",
      "description": "Updated description",
      "status": "COMPLETED",
      ...
    }
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "message": "Task not found or you are not the creator"
}
```

---

### 5. Delete Task

**DELETE** `/api/tasks/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Example:**
```
DELETE http://localhost:5000/api/tasks/task-uuid-1
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Task deleted successfully"
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "message": "Task not found or you are not the creator"
}
```

---

### 6. Assign Task to User

**PATCH** `/api/tasks/:id/assign`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (provide either email or ID):**
```json
{
  "assigneeEmail": "teammate@example.com"
}
```

OR

```json
{
  "assigneeId": "user-uuid"
}
```

**Example:**
```
PATCH http://localhost:5000/api/tasks/task-uuid-1/assign
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "task": {
      "id": "task-uuid-1",
      "title": "Complete Phase 4",
      "assigneeId": "assigned-user-id",
      "pendingAssigneeEmail": null,
      "assignee": {
        "id": "assigned-user-id",
        "name": "Teammate Name",
        "email": "teammate@example.com",
        "image": "https://example.com/teammate.jpg"
      },
      ...
    }
  }
}
```

**Note:** If the email doesn't exist in the system yet, it will be stored as `pendingAssigneeEmail` and automatically linked when that user signs up.

---

### 7. Update Task Status

**PATCH** `/api/tasks/:id/status`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "status": "COMPLETED"
}
```

Valid status values: `PENDING` or `COMPLETED`

**Example:**
```
PATCH http://localhost:5000/api/tasks/task-uuid-1/status
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "task": {
      "id": "task-uuid-1",
      "title": "Complete Phase 4",
      "status": "COMPLETED",
      ...
    }
  }
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "message": "Valid status is required (PENDING or COMPLETED)"
}
```

---

### 8. Verify Token

**GET** `/api/auth/verify`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "status": "success",
  "user": {
    "id": "user-uuid",
    "email": "your-email@gmail.com",
    "name": "Your Name",
    "image": "https://example.com/image.jpg"
  }
}
```

---

## 🧪 Testing Workflow in Postman

### Step 1: Set up Environment Variables
1. Create a new environment in Postman
2. Add variable `baseUrl` = `http://localhost:5000`
3. Add variable `token` = (leave empty for now)

### Step 2: Get Your Token
1. Create a request: **POST** `{{baseUrl}}/api/auth/sync`
2. Body:
   ```json
   {
     "email": "test@example.com",
     "name": "Test User",
     "image": "https://example.com/avatar.jpg"
   }
   ```
3. Send the request
4. Copy the token from response
5. Set it in your environment: `token` = `your-token-here`

### Step 3: Test Task Endpoints
1. Create a new collection "Task Manager API"
2. Add Authorization to collection:
   - Type: Bearer Token
   - Token: `{{token}}`
3. Create requests for each endpoint
4. All child requests will inherit the auth

### Step 4: Test Scenarios

**Scenario 1: Create and List Tasks**
1. POST `/api/tasks` - Create 3 tasks
2. GET `/api/tasks` - Verify all 3 appear
3. GET `/api/tasks?filter=created` - Should show your 3 tasks

**Scenario 2: Update and Delete**
1. Copy a task ID from the list
2. PUT `/api/tasks/:id` - Update the title
3. GET `/api/tasks/:id` - Verify the change
4. DELETE `/api/tasks/:id` - Delete it
5. GET `/api/tasks` - Verify it's gone

**Scenario 3: Task Assignment**
1. Create a task
2. PATCH `/api/tasks/:id/assign` with an email
3. PATCH `/api/tasks/:id/status` to mark as COMPLETED
4. GET `/api/tasks?filter=assigned` - Should show assigned tasks

---

## 🚨 Common Errors

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "No token provided. Authorization denied."
}
```
**Solution:** Add Authorization header with Bearer token

### 404 Not Found
```json
{
  "status": "error",
  "message": "Task not found or access denied"
}
```
**Solution:** Check task ID or ensure you have access (creator/assignee)

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Title is required"
}
```
**Solution:** Ensure required fields are provided

---

## 📦 Postman Collection

You can import this collection into Postman:

1. Click "Import" in Postman
2. Create a new collection manually
3. Add all the requests above
4. Set up environment variables

Or test directly in your browser using the frontend at http://localhost:3000 after we complete Phase 5!

---

**🎉 Phase 4 Complete! All backend task CRUD endpoints are ready for testing!**
