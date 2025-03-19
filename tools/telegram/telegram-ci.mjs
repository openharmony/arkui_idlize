import http from 'http'
import https from 'https'

const projectUrl = process.env.CI_PROJECT_URL
const projectName = process.env.CI_PROJECT_NAME
const branchName = process.env.CI_COMMIT_REF_SLUG
const pipelineId = process.env.CI_PIPELINE_ID
const author = process.env.CI_COMMIT_AUTHOR
const jobName = process.env.CI_JOB_NAME

const groupId = process.env.TELEGRAM_GROUP_ID
const [userId, threadId] = groupId.split("_")
const botToken = process.env.TELEGRAM_BOT_TOKEN

const args = process.argv.slice(2);
const status = args[0]

function httpPost(url, data) {
    const protocol = url.startsWith('https') ? https : http

    const postData = JSON.stringify(data)

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 5000
    };

    return new Promise((resolve, reject) => {

        const request = protocol.request(url, options, (response) => {
    
            let responseData = '';
        
            response.on('data', (chunk) => {
                responseData += chunk;
            });
        
            response.on('end', () => {
                const { statusCode } = response
                const isSuccess = statusCode >= 200 && statusCode <= 299
                isSuccess ? resolve(responseData) : reject(new Error(`Request failed. status: ${statusCode}, body: ${responseData}`))
            });
    
        });
          
        request.on('error', (error) => {
            reject(new Error(`Error: ${error.message}`))
        });
    
        request.write(postData);
        request.end();
    })
      
}

async function send() {
    const message = `${jobName}: ${status}\n\nURL:${projectUrl}/pipelines/${pipelineId}/\nBranch:${branchName}\nAuthor:${author}`

    await httpPost(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        message_thread_id: threadId,
        chat_id: userId,
        disable_web_page_preview: 1,
        text: message
    })
}

send()
