const axios = require('axios');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNGQ0ZDAzMS1jOWU1LTQ0MDItOWM2Yy02ZmU0NGUxMWJmNDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5MDYxNTg2fQ._Ic01eKrFW3Ir42wB7yX2YK4p1xUeUf_CfooT4IrJn8';
const N8N_URL = 'http://localhost:5678';

console.log('🔧 TESTING NEO4J CREDENTIALS WITH API...\n');

async function testCredentials() {
    try {
        // Test 1: Test Neo4j connection with bolt protocol
        console.log('⚡ Testing bolt:// protocol...');
        
        const testCredentialBolt = {
            credentialData: {
                uri: 'bolt://neo4j-test:7687',
                username: 'neo4j',
                password: 'password123',
                database: 'neo4j'
            }
        };
        
        const responseBolt = await axios.post(
            `${N8N_URL}/api/v1/credentials/test`, 
            {
                type: 'neo4jApi',
                data: testCredentialBolt
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ bolt:// protocol test result:', responseBolt.data);
        
        // Test 2: Test Neo4j connection with neo4j protocol
        console.log('\n⚡ Testing neo4j:// protocol...');
        
        const testCredentialNeo4j = {
            credentialData: {
                uri: 'neo4j://neo4j-test:7687',
                username: 'neo4j', 
                password: 'password123',
                database: 'neo4j'
            }
        };
        
        const responseNeo4j = await axios.post(
            `${N8N_URL}/api/v1/credentials/test`,
            {
                type: 'neo4jApi',
                data: testCredentialNeo4j
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ neo4j:// protocol test result:', responseNeo4j.data);
        
    } catch (error) {
        if (error.response) {
            console.log('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

// Wait for n8n to fully start
setTimeout(testCredentials, 5000);