import { NextApiRequest, NextApiResponse } from 'next';
import Groq from 'groq-sdk';
import fs from 'fs';
import { CaseStudy } from '@/components/CaseStudyClass';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const llmResponse = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      const { userInput } = req.body;
      console.log('Request Body:', req.body);
      // Fetch the chat completion based on user input
      const chatCompletion = await getGroqChatCompletion(userInput);      
      let responseContent = chatCompletion.choices[0].message.content;
      if (responseContent) responseContent = responseContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      res.status(200).json(responseContent); // Send the response back to the client
      console.log(responseContent,"what am i")
    } catch (error) {
      console.error('Error fetching chat completion:', error);
      res.status(500).json({ error: 'Failed to fetch chat completion' });
    }
  } else {
    // Handle non-POST requests
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};


// Function to fetch chat completion from Groq
const getGroqChatCompletion = async (userInput: string) => {
   
 const rawData = fs.readFileSync('./pages/api/knowledge.json', 'utf-8');
  const data = JSON.parse(rawData);
  const knowledgeBase: CaseStudy[] = data.case_studies;
  const relevantCases = knowledgeBase
    .filter((caseStudy) => caseStudy.industry.toLowerCase().includes(userInput.toLowerCase()))
    .slice(0, 3); // Limit to 3 relevant case studies
    
  console.log(relevantCases,"what am i")
  const uniqueIndustries = Array.from(
    new Set(knowledgeBase.map((caseStudy) => caseStudy.industry.toLowerCase()))
  );
  return groq.chat.completions.create({
    messages: [
      {
        role:'user',
        content:userInput
      },
      {
        role: 'system',
        // content:`respond to this user input like a chatbot${userInput} in a very summarized short and concise manner.`
        // content:`this is user data ${questionare_data}, generate 4 vibes that best suit, 2 words, simple`
        content: `
                  Instruction: You are a helpful assistant teaching students how to interview customers to    understand their motivations.

                  Wait for the user to type anything to begin. Prompt the user which industry he is interested in from these options ${uniqueIndustries}

                  The following is the knowledge that you have containing a list of real world projects and personas ${relevantCases}. Respond as if you were that persona talking to the user, providing realistic answers. 
                  Example:
                  "Hi, I’m <name>, <profession>, <role>. I worked on <project title>. What would you like to know?"

                  Additionally, at the end of each conversation provide a 1 sentence short and concise feedback at the end of every response, highlighting how the user can improve their interview 
                  techniques to be more engaging, purposeful, emotionally intelligent, and value-driven. 

                  Example Feedback:
                  1. Highlight whether the user's questions are clear, purposeful, and emotionally intelligent.
                  2. Suggest improvements to engage the persona customer more effectively.
                  3. Emphasize ways to uncover valuable insights without wasting the interviewee's time.

                  `
      },
    ],
    model: 'Deepseek-R1-Distill-Llama-70b',
    // model:"llama3-8b-8192",  
  });
};

export default llmResponse;
