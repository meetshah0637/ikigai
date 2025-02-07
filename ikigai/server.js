// require('dotenv').config();
// const express = require('express');
// const axios = require('axios');
// const path = require('path');

// const app = express();
// const PORT = 3000;

// // Middleware
// app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// // Endpoint for generating life purpose
// app.post('/generate', async (req, res) => {
//   const { name, passion } = req.body;

//   try {
//     const response = await axios.post(
//       'https://api.dify.ai/v1', // Example Dify API endpoint
//       {
//         messages: [
//           { role: 'system', content: 'You are a life purpose generator.' },
//           {
//             role: 'user',
//             content: `Help me find my life purpose. My name is ${name} and my passion is ${passion}.`
//           }
//         ]
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     const lifePurpose = response.data.choices[0].message.content;
//     res.json({ lifePurpose });
//   } catch (error) {
//     console.error('Error fetching response from Dify:', error);
//     res.status(500).json({ error: 'Failed to generate life purpose' });
//   }
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });
// Load environment variables from .env file
require('dotenv').config();

// Import required dependencies
const express = require('express');
const axios = require('axios');
const path = require('path');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to construct the Ikigai prompt
function constructIkigaiPrompt(userData) {
    return `As a life purpose advisor using the Ikigai framework, help me discover my purpose:
    
    About me:
    - Name: ${userData.name}
    - What I love (Passion): ${userData.passion}
    - What I'm good at (Mission): ${userData.mission}
    - What the world needs (Vocation): ${userData.vocation}
    - What I can be paid for (Profession): ${userData.profession}
    
    Please analyze these elements and provide insights about where they intersect to form my Ikigai.
    Consider:
    1. How my passions align with my skills
    2. Where my skills meet market demands
    3. How my interests can serve the world's needs
    4. Potential career paths or life directions that combine these elements
    
    Provide a structured response that includes specific suggestions and action steps.`;
}

// Main endpoint for generating Ikigai-based life purpose
app.post('/generate', async (req, res) => {
    // Extract all Ikigai elements from request body
    const { name, passion, mission, vocation, profession } = req.body;
    
    // Input validation
    if (!name || !passion || !mission || !vocation || !profession) {
        return res.status(400).json({
            error: 'Missing required fields',
            message: 'Please provide all Ikigai elements: name, passion, mission, vocation, and profession'
        });
    }

    // const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    // console.log(process.env.DIFY_API_ENDPOINT,'process.env.DIFY_API_ENDPOINT')
    // try {
    //     // Construct API request to Dify
    //     const difyResponse = await axios.post(
    //         process.env.DIFY_API_ENDPOINT,
    //         {
    //             messages: [
    //                 {
    //                     role: 'system',
    //                     content: 'You are an Ikigai advisor, specialized in helping people find their life purpose by analyzing the intersection of their passions, skills, world needs, and potential income sources.'
    //                 },
    //                 {
    //                     role: 'user',
    //                     content: constructIkigaiPrompt({ name, passion, mission, vocation, profession })
    //                 }
    //             ],
    //             // Optional parameters for the Dify API
    //             temperature: 0.7, // Balanced between creativity and consistency
    //             max_tokens: 1000  // Allowing for detailed responses
    //         },
    //         {
    //             headers: {
    //                 'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
    //                 'Content-Type': 'application/json'
    //             }
    //         }
    //     );

    //     // Extract and process the response
    //     const aiResponse = difyResponse.data.choices[0].message.content;

    //     // Send processed response back to client
    //     res.json({
    //         success: true,
    //         data: {
    //             name,
    //             ikigaiElements: {
    //                 passion,
    //                 mission,
    //                 vocation,
    //                 profession
    //             },
    //             analysis: aiResponse
    //         }
    //     });
    try {
        // Construct API request to Dify
        const difyResponse = await axios.post(
            'https://api.dify.ai/v1/chat-messages',
            {
                inputs: {},
                query: constructIkigaiPrompt({ name, passion, mission, vocation, profession }),
                response_mode: 'blocking', // Changed to 'blocking' to get the full response at once
                conversation_id: '', // Can be used to track conversations
                user: 'ikigai-user-123',
                // Optional file example
                // files: [
                //     {
                //         type: 'image',
                //         transfer_method: 'remote_url',
                //         url: 'https://cloud.dify.ai/logo/logo-site.png'
                //     }
                // ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Extract and process the response
        const aiResponse = difyResponse.data.answer; // Adjusted according to the expected response format

        // Send processed response back to client
        res.json({
            success: true,
            data: {
                name,
                ikigaiElements: {
                    passion,
                    mission,
                    vocation,
                    profession
                },
                analysis: aiResponse
            }
        });

    } catch (error) {
        // Enhanced error handling
        console.error('Error processing Ikigai analysis:', error);
        
        const errorResponse = {
            success: false,
            error: 'Failed to generate Ikigai analysis',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        };

        // Check for specific error types
        if (error.response) {
            // Dify API error
            errorResponse.status = error.response.status;
            errorResponse.message = 'Error communicating with AI service';
        } else if (error.request) {
            // Network error
            errorResponse.status = 503;
            errorResponse.message = 'Unable to reach AI service';
        }

        res.status(errorResponse.status || 500).json(errorResponse);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🌟 Ikigai Server running at http://localhost:${PORT}`);
    console.log('✨ Ready to help people find their life purpose!');
});