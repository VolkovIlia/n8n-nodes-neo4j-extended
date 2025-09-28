const { exec } = require('child_process');

console.log('🔧 TESTING NEO4J CONNECTION FROM N8N CONTAINER...\n');

// Test 1: Network connectivity
console.log('📡 Testing network connectivity...');
exec('docker exec -it n8n-test ping -c 1 neo4j-test', (error, stdout) => {
    if (error) {
        console.log('❌ Network ping failed:', error.message);
    } else {
        console.log('✅ Network ping successful');
    }
    
    // Test 2: Port connectivity  
    console.log('\n🔌 Testing port 7687 connectivity...');
    exec('docker exec -it n8n-test nc -z neo4j-test 7687', (error, stdout) => {
        if (error) {
            console.log('❌ Port 7687 not accessible:', error.message);
        } else {
            console.log('✅ Port 7687 accessible');
        }
        
        // Test 3: Neo4j driver test
        console.log('\n⚡ Testing Neo4j driver connection...');
        
        const testScript = `
        const neo4j = require('neo4j-driver');
        const driver = neo4j.driver('neo4j://neo4j-test:7687', neo4j.auth.basic('neo4j', 'password123'));
        
        (async () => {
            try {
                const session = driver.session();
                const result = await session.run('RETURN 1 as test');
                console.log('✅ Neo4j driver connection successful!');
                console.log('Result:', result.records[0].get('test'));
                await session.close();
                await driver.close();
            } catch (error) {
                console.log('❌ Neo4j driver connection failed:', error.message);
            }
        })();
        `;
        
        require('fs').writeFileSync('/tmp/neo4j-test.js', testScript);
        exec('docker exec -it n8n-test node /tmp/neo4j-test.js', (error, stdout, stderr) => {
            if (error) {
                console.log('❌ Neo4j driver test failed:', error.message);
            } else {
                console.log(stdout);
            }
            
            // Final instructions
            console.log('\n📋 INSTRUCTIONS FOR FIXING CREDENTIALS:');
            console.log('1. Go to http://localhost:5678');
            console.log('2. Login: ilia.volkov@outlook.com / Password123');
            console.log('3. Settings → Credentials → Find "Neo4j account"');
            console.log('4. Change Connection URI to: neo4j://neo4j-test:7687');
            console.log('5. Set Username: neo4j');
            console.log('6. Set Password: password123');
            console.log('7. Set Database: neo4j');
            console.log('8. Click "Test Connection" - should work! ✅');
        });
    });
});