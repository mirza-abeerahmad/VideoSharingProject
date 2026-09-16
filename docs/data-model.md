# Video Sharing Project - Data Model Design

## Collections

1. User
2. Video
3. Comment
4. Like
5. Subscription
6. Playlist
7. WatchHistory

## Relationship Decisions

### User and Video
One User can upload many Videos.
Video stores the User ObjectId in the owner field.

Reason:
Videos are large resources, so they should be referenced.

### User and Comment
One User can create many Comments.
Comment stores the User ObjectId in the owner field.

### Video and Comment
One Video can have many Comments.
Comment stores the Video ObjectId in the video field.

### User and Video Like
A Like belongs to one User and one Video.
A unique compound index on user and video prevents duplicate likes.

### User and Subscription
A Subscription stores:
- subscriber
- channel

Both fields reference the User collection.

### User and Playlist
A Playlist belongs to one User.
Playlist stores an array of Video ObjectIds.

### WatchHistory
WatchHistory stores:
- user
- video
- watchedAt
- progress

WatchHistory is stored separately because it can grow continuously.

## Audit Fields

Every major document should contain:
- createdAt
- updatedAt
- isDeleted
- deletedAt

## Counter Strategy

### Likes
Use atomic increment/decrement operations.
Prevent duplicate likes using a unique compound index.

### Views
Increment views atomically.
Avoid counting repeated views from the same user/session within a defined period.

### Subscribers
Update subscriber counts when a subscription is created or removed.
Use transactions or a reconciliation process to correct inconsistent counters.

## Delete Strategy

Use soft delete:
- isDeleted: true
- deletedAt: current date

Do not permanently delete important user-generated content by default.

## Schema Diagram

```mermaid
erDiagram
    USER ||--o{ VIDEO : uploads
    USER ||--o{ COMMENT : writes
    VIDEO ||--o{ COMMENT : contains
    USER ||--o{ LIKE : creates
    VIDEO ||--o{ LIKE : receives
    USER ||--o{ SUBSCRIPTION : subscribes
    USER ||--o{ PLAYLIST : owns
    PLAYLIST }o--o{ VIDEO : contains
    USER ||--o{ WATCH_HISTORY : has
    VIDEO ||--o{ WATCH_HISTORY : watched