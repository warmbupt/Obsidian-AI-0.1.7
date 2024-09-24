import { requestUrl, RequestUrlParam } from "obsidian";
import { DEFAULT_SETTINGS } from "main";

export class ChatGPT {
    openai: any;
    apiKey: string;
    baseUrl: string;
    model: string;

    constructor(apiKeyParam: string, baseUrlParam?: string, modelParam?: string) {
        this.apiKey = apiKeyParam;
        this.baseUrl = (baseUrlParam ? `${baseUrlParam}/v1/chat/completions` : 'https://api.openai.com/v1/chat/completions');
        this.model = modelParam || 'gpt-3.5-turbo';
    }

    public async createCompletion(params = {}, onData: (data: string) => void) {
        const params_ = { ...params, model: this.model, stream: true };
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params_)
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader?.read()!;
                done = doneReading;
                const chunk = decoder.decode(value, { stream: true });

                // 解析 JSON 数据块并提取 content 字段
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const json = line.replace('data: ', '');
                        if (json !== '[DONE]') {
                            const parsed = JSON.parse(json);
                            const content = parsed.choices[0].delta.content;
                            if (content) {
                                onData(content);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error in createCompletion:", error);
            onData("An error occurred while processing your request.");
        }
    }

    private sendToAPI = async (file: string, prompt: string, onData: (data: string) => void) => {
        file = file.replace(/(\r\n|\n|\r|\t|")/gm, " ");
        prompt = prompt.replace(/(\r\n|\n|\r|\t|")/gm, " ");

        if (file.slice(-1) !== ".") {
            file = file + ".";
        }

        try {
            await this.createCompletion({
                messages: [
                    { "role": "system", "content": `"${prompt}"` },
                    { "role": "user", "content": `"${file}"` }
                ]
            }, onData);
        } catch (error) {
            console.error(error);
        }
    }

    public improveWriting = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to improve a piece of writing. Don't change the ideas, just improve the writing.`;
        await this.sendToAPI(file, prompt, onData);
    }

    public helpMeWrite = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping a user write more content in a document based on a prompt. Output in markdown format. Do not use links. Do not include literal content from the original document.
Use this format, replacing text in brackets with the result. Do not include the brackets in the output: 
Output in [Identified language of the document]: 
[Output based on the prompt, in markdown format.]`;

        await this.sendToAPI(file, prompt, onData);
    }

    public ask = async (file: string, onData: (data: string) => void) => {
        let prompt = ""

        await this.sendToAPI(file, prompt, onData);
    }

    public brainstormIdeas = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping brainstorm a list of ideas inside a document.
        Use this format, replacing text in brackets with the result. Do not include the brackets in the output:
        10 ideas based on the topic, in [Identified language of the prompt]:
        
        - [Idea 1]
        - [Idea 2]
        - [Idea 3]
        - [Idea 4]
        - [Idea 5]
        - [Idea 6]
        - [Idea 7]
        - [Idea 8]
        - [Idea 9]
        - [Idea 10]`;

        await this.sendToAPI(file, prompt, onData);
    }

    public continueWriting = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping a user write a document. Output how the document continues, no more than 3 sentences. Output in markdown format. Do not use links.
        Use this format, replacing text in brackets with the result. Do not include the brackets in the output:
        
        Continuation in [Identified language of the document]:
        [Continuation of the document in markdown format, no more than 3 sentences.]`;

        await this.sendToAPI(file, prompt, onData);
    }

    public summarize = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping summarize a document. Use this format, replacing text in brackets with the result. Do not include the brackets in the output: 

        Summary in [Identified language of the document]: 
        
        [One-paragraph summary of the document using the identified language.]`;

        await this.sendToAPI(file, prompt, onData);
    }

    public findActionItems = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping find action items inside a document. An action item is an extracted task or to-do found inside of an unstructured document. Use this format, replacing text in brackets with the result. Do not include the brackets in the output:

        List of action items in [Identified language of the document]:
        [List of action items in the identified language, in markdown format. Prefix each line with "- []" to make it a checkbox.]`;

        await this.sendToAPI(file, prompt, onData);
    }

    public blogPost = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to generate a blog post on a given topic. 
        Use this format, replacing text in brackets with the result. Do not include the brackets in the output:
        
        Blog post in [Identified language of the topic]
        
        # [Topic of the blog post]
        [Blog post body]`;

        await this.sendToAPI(file, prompt, onData);
    }

    public prosAndConsList = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to generate a list of pros and cons about a topic. Use this format, replacing text in brackets with the result. Do not include the brackets in the output: 

        Pros and cons in [Identified language of the topic]: 
        
        ## ["Pros" in the identified language] 
        
        [List of 5 pros, one sentence each.] 
        
        ## ["Cons" in the identified language] 
        
        [List of 5 cons, one sentence each.]`;

        await this.sendToAPI(file, prompt, onData);
    }

    public socialMediaPost = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to draft a social media post. Use this format, replacing text in brackets with the result. Do not include the brackets in the output:

        Post in [Identified language of the topic]:
        
        # [Title]
        
        [One paragraph post body] 
        
        Tags: [List of relevant #hashtags]`;

        await this.sendToAPI(file, prompt, onData);
    }

    public outline = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to draft an outline for a document. Use this format, replacing text in brackets with the result. Do not include the brackets in the output: 

        Outline in [Identified language of the topic]: 
        
        # [Title of document] 
        [Bulleted list outline of document, in markdown format]`

        await this.sendToAPI(file, prompt, onData);
    }

    public creativeStory = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to write a creative story. Use this format, replacing text in brackets with the result. Do not include the brackets in the output: 

        Story in [Identified language of the topic]: 
        
        # [Title of story] 
        [First 5 paragraphs of story]`

        await this.sendToAPI(file, prompt, onData);
    }

    public poem = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to write a poem. Use this format, replacing text in brackets with the result. Do not include the brackets in the output: 

        Poem in [Identified language of the topic]: 
        
        # [Title of poem] 
        [Poem, at least 4 lines]`

        await this.sendToAPI(file, prompt, onData);
    }

    public essay = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to write an essay. 
        Use this format, replacing text in brackets with the result. Do not include the brackets in the output: 
        
        Essay in [Identified language of the topic]:
        
          # [Essay title]
          
          [Introduction paragraph]
          
          ## [Name of topic 1]
          
          [Paragraph about topic 1]
          
          ## [Name of topic 2]
          
          [Paragraph about topic 2]
          
          ## [Name of topic 3]
          
          [Paragraph about topic 3]
          
          ## ['Conclusion', in the identified language of the topic]
          
          [Conclusion paragraph]`

        await this.sendToAPI(file, prompt, onData);
    }

    public meetingAgenda = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to write a meeting agenda. 
        Use this format, replacing text in brackets with the result. Do not include the brackets in the output: 
        
        Meeting agenda in [Identified language of the topic]: 
        
        # [Meeting name] 
        
        [Introduction paragraph about the purpose and goals of the meeting] 
        
        [Bulleted list of at least 3 topics, in markdown format. Make sure to include details for each topic.]`

        await this.sendToAPI(file, prompt, onData);
    }

    public pressRelease = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to draft a press release. Use this format, replacing text in brackets with the result. Do not include the brackets in the output: 

        Press release in [Identified language of the topic]: 
        
        # [Press release headline] 
        [Press release body, in markdown format.] `

        await this.sendToAPI(file, prompt, onData);
    }

    public jobDescription = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to draft a job description. Use this format, replacing text in brackets with the result. Do not include the brackets in the output: 

        Job description in [Identified language of the prompt]: 
        
        # [Job title] 
        
        ## ["Overview", in the identified language] 
        
        [Overview of job, one paragraph] 
        
        ## ["Responsibilities", in the identified language] 
        
        [Bulleted list of at least 3 key responsibilities] 
        
        ## ["Qualifications", in the identified language] 
        
        [Bulleted list of at least 3 key qualifications]`

        await this.sendToAPI(file, prompt, onData);
    }

    public salesEmail = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to draft a personalized sales email. Use this format, replacing text in brackets with the result. Do not include the brackets in the output:

        Output in [Identified language of the prompt]: 
        
        # [Sales email title] 
        [Sales email subject] 
        
        [Sales email body]`

        await this.sendToAPI(file, prompt, onData);
    }

    public recruitingEmail = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to draft a personalized recruiting email. Use this format, replacing text in brackets with the result. Do not include the brackets in the output:
  
        Recruiting email in [Identified language of the notes]:
            
        # [Recruiting email title]
          
            [Recruiting email subject] [Recruiting email body]`

        await this.sendToAPI(file, prompt, onData);
    }

    public fixSpellingAndGrammar = async (file: string, onData: (data: string) => void) => {
        let prompt = `You are an assistant helping to fix spelling and grammar in a piece of writing. Don't change the ideas, just fix the spelling and grammar.`

        await this.sendToAPI(file, prompt, onData);
    }

    public explainThis = async (file: string, onData: (data: string) => void) => {
        let prompt = `You will be given a text. Explain the text in a clear and easy to understand way. Don't make it too basic or too advanced.`

        await this.sendToAPI(file, prompt, onData);
    }

    public makeLonger = async (file: string, onData: (data: string) => void) => {
        let prompt = `You will be given a text. Make it longer. Don't change the ideas, just make it longer.`

        await this.sendToAPI(file, prompt, onData);
    }

    public makeShorter = async (file: string, onData: (data: string) => void) => {
        let prompt = `You will be given a text. Make it shorter. Don't change the ideas, just make it shorter.`

        await this.sendToAPI(file, prompt, onData);
    }

    public useSimplerLanguage = async (file: string, onData: (data: string) => void) => {
        let prompt = `You will be given a text. Rewrite the text to use simpler language. Don't change the ideas, just use simpler language.`

        await this.sendToAPI(file, prompt, onData);
    }
}
