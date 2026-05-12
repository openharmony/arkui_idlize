/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import http from 'http'
import https from 'https'
import { argv } from 'process'

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
const status = args[0] == 1
const statusIcon = status ? `✅` : `❌`

const stickers = [
    "CAACAgIAAxkBAAEzF5Nn5VZCtPpuIShtIHS6EzwofhnL-gAC9ggAAlwCZQONlIN4aWCoYDYE",
    "CAACAgIAAxkBAAEzFv5n5UgmNl2Hvb1O0Gh11l8oPe5c_wAChj4AAnj9EUorqVIjwrrubDYE",
    "CAACAgIAAxkBAAEzF3ln5VQ0Kz1D_1c3EperO10FGSSrrAAC7ggAAlwCZQM1FgF20HH7NjYE",
    "CAACAgIAAxkBAAEzF4ln5VUi0MxDcCDibY4wrIlu9ZhrTQAC8wgAAlwCZQMzPhhd28IVtzYE",
    "CAACAgIAAxkBAAEzF5dn5VZwrh4YUg46wGlo_LPYu28EZAAC7wgAAlwCZQNot15knn_aCDYE",
    "CAACAgIAAxkBAAEzF5ln5VaisovBF5YczPqXwANy_JWhlwAC5AgAAlwCZQPl4Awd5AG57zYE"
]

function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)]
}

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
    const message = `#idlize ${jobName}: ${statusIcon}\n\nURL:${projectUrl}/pipelines/${pipelineId}/\nBranch:${branchName}\nAuthor:${author}`

    await httpPost(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        message_thread_id: threadId,
        chat_id: userId,
        disable_web_page_preview: 1,
        text: message
    })

    if (!status) {
        await httpPost(`https://api.telegram.org/bot${botToken}/sendSticker`, {
            message_thread_id: threadId,
            chat_id: userId,
            disable_web_page_preview: 1,
            sticker: randomItem(stickers)
        })
    }
}

send()
