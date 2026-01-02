# LaTeX to PDF Compilation Setup

## Overview
The resume builder uses **LaTeX.Online** (https://latexonline.cc/) as a free, external service to compile LaTeX code to PDF. This approach works perfectly with Vercel's serverless architecture.

## How It Works

### 1. User Flow
1. User fills out resume forms
2. Clicks "Generate Resume" button
3. Frontend sends resume data to `/api/compile-resume`
4. Backend generates LaTeX code from the data
5. LaTeX code is sent to LaTeX.Online API for compilation
6. PDF is returned to the user as a download

### 2. Technical Implementation

**API Route**: `app/api/compile-resume/route.ts`
- Receives resume data as JSON
- Generates LaTeX code using template
- Calls LaTeX.Online API with the code
- Returns PDF as downloadable file

**Frontend**: `app/resumeow/page.tsx`
- Sends POST request with resume data
- Receives PDF blob
- Creates download link automatically
- Uses resume title for filename

### 3. LaTeX.Online Service

**Endpoint**: `https://latexonline.cc/compile`

**Request**:
```javascript
POST https://latexonline.cc/compile
Content-Type: application/x-www-form-urlencoded

text=<latex-code>
command=pdflatex
```

**Response**: Binary PDF file

**Features**:
- ✅ Free, no authentication required
- ✅ Supports standard LaTeX packages
- ✅ Works with Vercel serverless functions
- ✅ No deployment size issues
- ⚠️ Rate limits may apply for heavy usage

## Vercel Deployment Considerations

### Serverless Function Config
No special configuration needed. The API route works within standard Vercel limits:
- Max execution time: 10 seconds (Hobby), 60s (Pro)
- Max response size: 4.5 MB
- LaTeX compilation typically takes 2-5 seconds

### Environment Variables
None required for LaTeX.Online. If you switch to a service requiring API keys:
```env
LATEX_API_KEY=your_api_key_here
```

### Cloudflare DNS
Your Cloudflare DNS setup doesn't affect the LaTeX compilation. The API calls to LaTeX.Online happen server-side.

## Alternative Services (If Needed)

### 1. Overleaf API (Requires Account)
- More reliable for high volume
- Requires API key and premium account
- Better error reporting

### 2. Self-Hosted Solution
- Deploy Docker container with TexLive
- More control but higher complexity
- Good for high-volume production apps

### 3. Client-Side (SwiftLaTeX)
- WebAssembly-based TeX in browser
- No server dependency
- Large initial download (~20MB)

## Troubleshooting

### LaTeX Compilation Errors
Check the LaTeX template in `lib/latex/template.ts`:
- Ensure all special characters are escaped
- Verify package requirements match LaTeX.Online's distribution
- Test LaTeX code directly on https://latexonline.cc/

### Timeout Issues
If compilation times out:
- Simplify the LaTeX template
- Reduce package dependencies
- Consider switching to a faster service

### Rate Limiting
LaTeX.Online may rate limit heavy usage:
- Implement client-side debouncing
- Cache generated PDFs (if same data)
- Switch to authenticated service for production

## Testing

Test locally:
```bash
npm run dev
```

Then visit http://localhost:3000/resumeow and click "Generate Resume".

Test the API directly:
```bash
curl -X POST http://localhost:3000/api/compile-resume \
  -H "Content-Type: application/json" \
  -d @test-resume-data.json \
  --output test.pdf
```

## Production Deployment

When deploying to Vercel:
1. Push to GitHub
2. Vercel automatically deploys
3. No special build configuration needed
4. LaTeX.Online API calls work automatically

The service is stateless and requires no server-side LaTeX installation, making it perfect for Vercel's serverless platform.
