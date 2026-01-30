# Troubleshooting Guide - AI Fitness Coach

## Common Issues and Solutions

### 1. "OpenAI API key not configured" Error

**Problem:** The backend returns an error saying the API key is not configured.

**Solution:**
1. Make sure you have a `.env` file in the `backend/` directory (or root directory)
2. Add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Restart the backend server after adding the key
4. Verify the key is valid by checking your OpenAI account

### 2. "Invalid OpenAI API key" Error (401)

**Problem:** The API key is set but OpenAI rejects it.

**Solutions:**
- Verify your API key is correct (starts with `sk-`)
- Check if your OpenAI account has credits
- Ensure there are no extra spaces or quotes around the key in `.env`
- Regenerate the API key from https://platform.openai.com/api-keys

### 3. "Rate limit exceeded" Error (429)

**Problem:** Too many requests to OpenAI API.

**Solutions:**
- Wait a few minutes and try again
- Upgrade your OpenAI plan for higher rate limits
- Reduce the frequency of requests

### 4. "Model not found" Error (404)

**Problem:** The specified OpenAI model doesn't exist or isn't available.

**Solutions:**
- The default model is `gpt-3.5-turbo` (more accessible)
- If you want to use `gpt-4`, ensure your account has access
- Set `OPENAI_MODEL=gpt-3.5-turbo` in your `.env` file

### 5. Messages Not Appearing

**Problem:** You send a message but nothing happens.

**Check:**
1. Open browser console (F12) and check for errors
2. Verify backend is running on port 3001
3. Check network tab to see if the request is being sent
4. Verify authentication token is present in localStorage

### 6. Backend Not Receiving Requests

**Problem:** Frontend can't connect to backend.

**Solutions:**
- Verify `NEXT_PUBLIC_API_URL` in `.env` matches your backend URL
- Check CORS configuration in backend
- Ensure backend server is running: `cd backend && npm run dev`
- Check backend logs for errors

### 7. Database Errors

**Problem:** Chat messages not saving.

**Solutions:**
- Verify database connection in `DATABASE_URL`
- Run migrations: `npm run db:migrate`
- Check Prisma client is generated: `npm run db:generate`
- Check backend logs for database errors

## Debugging Steps

1. **Check Backend Logs:**
   ```bash
   cd backend
   npm run dev
   # Look for error messages in the console
   ```

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for error messages
   - Go to Network tab to see API requests/responses

3. **Test API Directly:**
   ```bash
   # Test with curl (replace TOKEN with your JWT token)
   curl -X POST http://localhost:3001/api/chat/message \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}'
   ```

4. **Verify Environment Variables:**
   ```bash
   # In backend directory
   node -e "console.log(process.env.OPENAI_API_KEY ? 'Set' : 'Not set')"
   ```

## Quick Fixes

### Reset Chat History
If chat is stuck, you can clear messages in the database:
```sql
DELETE FROM chat_messages WHERE user_id = 'your-user-id';
```

### Use Fallback Model
If `gpt-4` doesn't work, the code automatically falls back to `gpt-3.5-turbo`. You can also explicitly set:
```env
OPENAI_MODEL=gpt-3.5-turbo
```

### Test OpenAI Connection
Test your API key directly:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Still Having Issues?

1. Check all three services are running:
   - Backend (port 3001)
   - Frontend (port 3000)
   - Database (MySQL)

2. Verify all environment variables are set correctly

3. Check the backend terminal for detailed error messages

4. Review the error message in the chat interface - it now shows more specific error details
