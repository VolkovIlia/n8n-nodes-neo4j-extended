const { execSync } = require('child_process');

console.log('🔧 ISOLATED NEO4J PROTOCOL DIAGNOSTICS');
console.log('=====================================\n');

// Test 1: Check n8n container neo4j-driver version
console.log('📦 Checking neo4j-driver version in n8n container...');
try {
    const driverVersion = execSync('docker exec n8n-test npm list neo4j-driver', { encoding: 'utf8' });
    console.log('✅ Driver version found:');
    console.log(driverVersion);
} catch (error) {
    console.log('❌ neo4j-driver not found or issue:', error.message);
}

// Test 2: Test different protocol formats
console.log('\n⚡ Testing different URI protocols directly...');

const testProtocols = [
    'bolt://neo4j-test:7687',
    'neo4j://neo4j-test:7687', 
    'bolt+routing://neo4j-test:7687',
    'neo4j+s://neo4j-test:7687'
];

testProtocols.forEach(uri => {
    console.log(`\n🔌 Testing: ${uri}`);
    
    const testScript = `
const neo4j = require('neo4j-driver');
try {
    const driver = neo4j.driver('${uri}', neo4j.auth.basic('neo4j', 'password123'));
    console.log('✅ Driver created successfully for ${uri}');
    driver.close();
} catch (error) {
    console.log('❌ Failed for ${uri}:', error.message);
}
`;
    
    try {
        execSync(`docker exec n8n-test node -e "${testScript.replace(/\n/g, ' ')}"`, { 
            encoding: 'utf8',
            stdio: 'inherit'
        });
    } catch (error) {
        console.log(`❌ Protocol ${uri} failed: ${error.message}`);
    }
});

// Test 3: Check n8n logs for protocol errors
console.log('\n📋 Checking n8n logs for protocol errors...');
try {
    const logs = execSync('docker logs n8n-test --tail 50', { encoding: 'utf8' });
    const protocolErrors = logs.split('\n').filter(line => 
        line.includes('protocol') || 
        line.includes('neo4j') || 
        line.includes('connection') ||
        line.includes('ERROR')
    );
    
    if (protocolErrors.length > 0) {
        console.log('🔍 Found relevant log entries:');
        protocolErrors.forEach(line => console.log('  ', line));
    } else {
        console.log('📝 No protocol-related errors in recent logs');
    }
} catch (error) {
    console.log('❌ Failed to get n8n logs:', error.message);
}

console.log('\n🎯 DIAGNOSIS COMPLETE');
console.log('===================');