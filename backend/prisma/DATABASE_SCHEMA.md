# Database Schema Documentation

## 📊 Database Structure

### Tables

#### 1. **users** Table
Stores user information from Google OAuth authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR | UNIQUE, NOT NULL | User's email (indexed) |
| name | VARCHAR | NOT NULL | User's display name |
| image | VARCHAR | NULLABLE | User's profile picture URL |
| createdAt | TIMESTAMP | DEFAULT now() | Account creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes:**
- Primary: `id`
- Unique: `email`
- Index: `email` (for fast lookups)

---

#### 2. **tasks** Table
Stores all tasks with assignment information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique task identifier |
| title | VARCHAR | NOT NULL | Task title |
| description | TEXT | NULLABLE | Optional task description |
| status | ENUM | DEFAULT 'PENDING' | PENDING or COMPLETED |
| creatorId | UUID | FOREIGN KEY → users(id) | Task creator |
| assigneeId | UUID | FOREIGN KEY → users(id), NULLABLE | Assigned user (if exists) |
| pendingAssigneeEmail | VARCHAR | NULLABLE | Email if assignee not in system |
| createdAt | TIMESTAMP | DEFAULT now() | Task creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes:**
- Primary: `id`
- Index: `creatorId` (fast creator lookups)
- Index: `assigneeId` (fast assignee lookups)
- Index: `status` (filter by status)
- Index: `pendingAssigneeEmail` (find pending assignments)

**Foreign Keys:**
- `creatorId` → `users(id)` (CASCADE on delete)
- `assigneeId` → `users(id)` (SET NULL on delete)

---

#### 3. **Status** Enum
```sql
CREATE TYPE "Status" AS ENUM ('PENDING', 'COMPLETED');
```

---

## 🔗 Relationships

### User → Tasks (One-to-Many)
```
User (Creator)
  ├── Task 1 (created)
  ├── Task 2 (created)
  └── Task 3 (created)
```

### User → Tasks (One-to-Many - Assignee)
```
User (Assignee)
  ├── Task 1 (assigned)
  ├── Task 2 (assigned)
  └── Task 3 (assigned)
```

---

## 🎯 Assignment Logic

### Scenario 1: Assign to Existing User
```javascript
{
  assigneeEmail: "user@example.com" // exists in users table
  ↓
  assigneeId: "uuid-of-user"
  pendingAssigneeEmail: null
}
```

### Scenario 2: Assign to Non-Existent User
```javascript
{
  assigneeEmail: "newuser@example.com" // NOT in users table
  ↓
  assigneeId: null
  pendingAssigneeEmail: "newuser@example.com"
}
```

### Scenario 3: Auto-Link on Signup
```
1. New user signs up with "newuser@example.com"
2. System checks tasks where pendingAssigneeEmail = "newuser@example.com"
3. Updates those tasks:
   - assigneeId = new user's id
   - pendingAssigneeEmail = null
```

---

## 🔍 Common Queries

### Get User's Created Tasks
```typescript
await prisma.task.findMany({
  where: { creatorId: userId }
});
```

### Get User's Assigned Tasks
```typescript
await prisma.task.findMany({
  where: { assigneeId: userId }
});
```

### Get Pending Tasks for Email
```typescript
await prisma.task.findMany({
  where: { pendingAssigneeEmail: email }
});
```

### Create Task with Assignment
```typescript
// Existing user
await prisma.task.create({
  data: {
    title: "Task title",
    creatorId: currentUserId,
    assigneeId: assigneeUserId,
  }
});

// Pending user
await prisma.task.create({
  data: {
    title: "Task title",
    creatorId: currentUserId,
    pendingAssigneeEmail: "pending@example.com",
  }
});
```

---

## 🛠️ Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create migration (production-ready)
npx prisma migrate dev --name migration_name

# Deploy migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (Database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## 🔐 Security Features

1. **UUID Primary Keys**: Harder to guess than auto-increment integers
2. **Indexed Fields**: Fast queries on email, status, creatorId, assigneeId
3. **Cascade Delete**: When user is deleted, their created tasks are deleted
4. **Set Null**: When assignee is deleted, tasks remain but assignee is cleared
5. **Unique Email**: Prevents duplicate user accounts

---

## 📈 Performance Optimizations

1. **Indexes on Foreign Keys**: Fast JOIN operations
2. **Index on Email**: Fast user lookups during assignment
3. **Index on Status**: Fast filtering by task status
4. **Index on PendingAssigneeEmail**: Fast pending assignment lookups

---

## 🚀 Next Steps

After schema is set up:
1. ✅ Generate Prisma Client: `npx prisma generate`
2. ✅ Push to database: `npx prisma db push`
3. ✅ Test connection in code
4. ✅ Create service layer for database operations
5. ✅ Implement controllers and routes
