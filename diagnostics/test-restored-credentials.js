const axios = require('axios');

console.log('🔧 TESTING RESTORED NEO4J CREDENTIALS TEST');
console.log('==========================================\n');

// Simulate the credential test that n8n will perform
async function testCredentialConnection() {
    try {
        console.log('⚡ Testing HTTP API endpoint for credential test...');
        
        // Convert neo4j:// or bolt:// to http:// for testing
        const boltUri = 'bolt://neo4j-test:7687';
        const httpUri = boltUri.replace('bolt://', 'http://').replace(':7687', ':7474');
        
        console.log('Original URI:', boltUri);
        console.log('HTTP URI:', httpUri);
        
        // Test the HTTP endpoint
        const response = await axios.post(
            `${httpUri}/db/neo4j/tx/commit`,
            {
                statements: [
                    {
                        statement: 'RETURN 1 as test'
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from('neo4j:password123').toString('base64')
                }
            }
        );
        
        console.log('✅ HTTP API test successful!');
        console.log('Status:', response.status);
        console.log('Result:', response.data.results[0].data[0].row[0]);
        
    } catch (error) {
        if (error.response) {
            console.log('❌ HTTP API test failed:', error.response.status, error.response.data);
        } else {
            console.log('❌ HTTP API test error:', error.message);
        }
    }
}

// Wait for n8n to restart
setTimeout(testCredentialConnection, 10000);