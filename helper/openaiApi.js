// helper/openaiApi.js
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
console.time('generet');
const chatCompletion = async (prompt) => {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'AI chat model by Malagasy teams, based on Ahy bots, with limited knowledge and no connection to other APIs or AI.' },
        { role: 'user', content: `quick #3 sentence to replay : ${prompt}` },
      ],
      max_tokens: 200,
      temperature: 0.5,
      top_p: 0.5,
      frequency_penalty: 1.9,
      presence_penalty: 2,
      stop: ["\n "]
    });

    let content = response.data.choices[0].message.content;
    console.timeEnd('generet');
    // Get token counts from the API response's 'usage'
    const promptTokenCount = response.data.usage.prompt_tokens;
    const responseTokenCount = response.data.usage.completion_tokens;

    // Log the number of tokens for the prompt and the response
    console.log('Prompt tokens:', promptTokenCount);
    console.log('Response tokens:', responseTokenCount);

    return {
      status: 1,
      response: content,
    };
    
  } catch (error) {
    console.error('Error occurred while generating chat completion:', error);
    return {
      status: 0,
      response: '',
    };
  }
};

module.exports = {
  chatCompletion,
};
//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