# 🔗 MongoDB Cloud Setup Instructions

## How to get your MongoDB Atlas connection string:

1. **Log into MongoDB Atlas** (https://cloud.mongodb.com)
2. **Click "Connect"** on your cluster
3. **Choose "Connect your application"**
4. **Select "Node.js"** as your driver
5. **Copy the connection string**

## Your connection string format:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

## Example:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/ai-study-circle?retryWrites=true&w=majority
```

## Steps to update:
1. Open backend/.env file
2. Replace the MONGODB_URI value with your actual connection string
3. Make sure to replace:
   - <username> with your MongoDB user
   - <password> with your MongoDB password  
   - <cluster> with your cluster name
   - <database> with your database name (e.g., "ai-study-circle")

## Security Notes:
- Never commit your .env file to version control
- The .env file is already in .gitignore
- Keep your credentials secure