const axios = require('axios');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNGQ0ZDAzMS1jOWU1LTQ0MDItOWM2Yy02ZmU0NGUxMWJmNDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5MDYxNTg2fQ._Ic01eKrFW3Ir42wB7yX2YK4p1xUeUf_CfooT4IrJn8';
const N8N_URL = 'http://localhost:5678';

console.log('🔧 COMPREHENSIVE N8N API DIAGNOSTICS');
console.log('=====================================\n');

async function fullDiagnostic() {
    try {
        // Test 1: Check API status
        console.log('📡 Testing n8n API accessibility...');
        const healthCheck = await axios.get(`${N8N_URL}/api/v1/status`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        console.log('✅ n8n API Status:', healthCheck.data);

        // Test 2: List existing credentials
        console.log('\n📋 Listing existing credentials...');
        const credentialsList = await axios.get(`${N8N_URL}/api/v1/credentials`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        console.log('✅ Existing credentials count:', credentialsList.data.data.length);
        
        // Find Neo4j credential
        const neo4jCred = credentialsList.data.data.find(cred => cred.type === 'neo4jApi');
        if (neo4jCred) {
            console.log('🔍 Found Neo4j credential:', {
                id: neo4jCred.id,
                name: neo4jCred.name,
                type: neo4jCred.type
            });
        } else {
            console.log('❌ No Neo4j credential found');
        }

        // Test 3: Get credential types
        console.log('\n🧩 Checking available credential types...');
        const credTypes = await axios.get(`${N8N_URL}/api/v1/credential-types`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        
        const neo4jType = credTypes.data.find(type => type.name === 'neo4jApi');
        if (neo4jType) {
            console.log('✅ Neo4j credential type found:', {
                name: neo4jType.name,
                displayName: neo4jType.displayName,
                properties: neo4jType.properties?.map(p => p.name)
            });
        } else {
            console.log('❌ Neo4j credential type NOT FOUND');
            console.log('Available types:', credTypes.data.map(t => t.name));
        }

        // Test 4: Test credential if exists
        if (neo4jCred) {
            console.log('\n⚡ Testing existing Neo4j credential...');
            try {
                const testResult = await axios.post(
                    `${N8N_URL}/api/v1/credentials/${neo4jCred.id}/test`,
                    {},
                    { headers: { 'Authorization': `Bearer ${API_KEY}` } }
                );
                console.log('✅ Credential test successful:', testResult.data);
            } catch (testError) {
                console.log('❌ Credential test failed:', testError.response?.data || testError.message);
            }
        }

        // Test 5: Create new test credential
        console.log('\n🔧 Creating test credential with bolt:// protocol...');
        try {
            const newCred = await axios.post(
                `${N8N_URL}/api/v1/credentials`,
                {
                    name: 'Neo4j Test Bolt',
                    type: 'neo4jApi',
                    data: {
                        uri: 'bolt://neo4j-test:7687',
                        username: 'neo4j',
                        password: 'password123',
                        database: 'neo4j'
                    }
                },
                { headers: { 'Authorization': `Bearer ${API_KEY}` } }
            );
            console.log('✅ Bolt credential created:', newCred.data.id);
            
            // Test the new credential
            const boltTest = await axios.post(
                `${N8N_URL}/api/v1/credentials/${newCred.data.id}/test`,
                {},
                { headers: { 'Authorization': `Bearer ${API_KEY}` } }
            );
            console.log('✅ Bolt credential test result:', boltTest.data);
            
        } catch (createError) {
            console.log('❌ Failed to create/test bolt credential:', createError.response?.data || createError.message);
        }

        // Test 6: Create new test credential with neo4j://
        console.log('\n🔧 Creating test credential with neo4j:// protocol...');
        try {
            const newCredNeo4j = await axios.post(
                `${N8N_URL}/api/v1/credentials`,
                {
                    name: 'Neo4j Test Neo4j',
                    type: 'neo4jApi',
                    data: {
                        uri: 'neo4j://neo4j-test:7687',
                        username: 'neo4j',
                        password: 'password123',
                        database: 'neo4j'
                    }
                },
                { headers: { 'Authorization': `Bearer ${API_KEY}` } }
            );
            console.log('✅ Neo4j credential created:', newCredNeo4j.data.id);
            
            // Test the new credential
            const neo4jTest = await axios.post(
                `${N8N_URL}/api/v1/credentials/${newCredNeo4j.data.id}/test`,
                {},
                { headers: { 'Authorization': `Bearer ${API_KEY}` } }
            );
            console.log('✅ Neo4j credential test result:', neo4jTest.data);
            
        } catch (createError) {
            console.log('❌ Failed to create/test neo4j credential:', createError.response?.data || createError.message);
        }

    } catch (error) {
        console.log('❌ General API error:', error.response?.data || error.message);
    }
}

// Wait a bit for n8n to be ready
setTimeout(fullDiagnostic, 2000);