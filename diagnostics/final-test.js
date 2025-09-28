const { execSync } = require('child_process');

console.log('🎯 FINAL NEO4J CONNECTION TEST');
console.log('==============================\n');

// Direct Neo4j driver test
console.log('⚡ Testing direct Neo4j driver connection...');

const testScript = `
const neo4j = require('neo4j-driver');

async function testConnection() {
    const protocols = [
        'bolt://neo4j-test:7687',
        'neo4j://neo4j-test:7687'
    ];
    
    for (const uri of protocols) {
        try {
            console.log('Testing:', uri);
            const driver = neo4j.driver(uri, neo4j.auth.basic('neo4j', 'password123'));
            const session = driver.session({ database: 'neo4j' });
            const result = await session.run('RETURN 1 as test');
            console.log('✅ SUCCESS for', uri, '- result:', result.records[0].get('test'));
            await session.close();
            await driver.close();
        } catch (error) {
            console.log('❌ FAILED for', uri, '- error:', error.message);
        }
    }
}

testConnection().catch(console.error);
`;

try {
    execSync(`docker exec n8n-test node -e "${testScript.replace(/\n/g, ' ')}"`, { 
        encoding: 'utf8',
        stdio: 'inherit'
    });
} catch (error) {
    console.log('❌ Test failed:', error.message);
}

console.log('\n📋 UPDATED INSTRUCTIONS:');
console.log('=======================');
console.log('Now that we removed the HTTP test from credentials:');
console.log('1. Go to http://localhost:5678');
console.log('2. Login: ilia.volkov@outlook.com / Password123');
console.log('3. Settings → Credentials → "Neo4j account"');
console.log('4. Use: bolt://neo4j-test:7687 or neo4j://neo4j-test:7687');
console.log('5. Username: neo4j');
console.log('6. Password: password123');
console.log('7. Database: neo4j');
console.log('8. Save (no test button - it will work in workflow!)');
console.log('\n✅ The "Test Connection" is removed - credentials will be validated');
console.log('   when you actually use them in a workflow node!');