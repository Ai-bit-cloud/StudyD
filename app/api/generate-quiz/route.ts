import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const ghToken = formData.get('ghToken') as string;
    const repo = formData.get('repo') as string; // "owner/repo"
    const targetPath = (formData.get('path') as string) || 'quizzes';
    const type = formData.get('type') as string;

    if (!ghToken || !repo) {
      return NextResponse.json({ error: 'GitHub details are required.' }, { status: 400 });
    }

    let extractedText = '';

    // 1. Content Extraction
    if (type === 'url') {
      const targetUrl = formData.get('url') as string;
      const fetchRes = await fetch(targetUrl);
      const rawHtml = await fetchRes.text();
      // Strip simple HTML tags to isolate plain text content
      extractedText = rawHtml.replace(/<[^>]+>/g, ' ').slice(0, 10000);
    } else {
      const file = formData.get('file') as File;
      extractedText = await file.text();
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'Failed to extract text from input source.' }, { status: 400 });
    }

    // 2. Gemini AI Quiz Generation
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    const prompt = `
    You are an expert educator. Create a comprehensive quiz based on the following material.
    
    Format the quiz cleanly in GitHub-Flavored Markdown (.md) with:
    1. Title & Overview summary.
    2. 5 Multiple Choice Questions with options A-D.
    3. 3 Short Answer Questions.
    4. An Answer Key at the bottom inside a collapsed collapsible tag (<details><summary>Click to view Answer Key</summary>...</details>).

    Source Content:
    ${extractedText.slice(0, 8000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const quizMarkdown = response.text || '# Quiz Generation Failed';

    // 3. GitHub REST API Integration
    const [owner, repoName] = repo.split('/');
    const fileName = `quiz-${Date.now()}.md`;
    const filePath = `${targetPath}/${fileName}`;
    
    // Base64 encode file content for GitHub API
    const contentEncoded = Buffer.from(quizMarkdown).toString('base64');

    const ghResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ghToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Studyd-App',
      },
      body: JSON.stringify({
        message: `Add generated quiz: ${fileName}`,
        content: contentEncoded,
      }),
    });

    const ghData = await ghResponse.json();

    if (!ghResponse.ok) {
      throw new Error(ghData.message || 'Failed to commit to GitHub.');
    }

    return NextResponse.json({
      success: true,
      commitUrl: ghData.content?.html_url || `https://github.com/${repo}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
