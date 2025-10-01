# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :x: (See CVE below)|
| < 1.0   | :x:                |

## Security Vulnerabilities

### CVE-2025-XXXXX: Cypher Injection (CRITICAL)

**Affected Versions**: 1.0.0 - 1.0.4  
**Fixed in**: 1.1.0  
**Severity**: Critical (CVSS 9.8)  
**Status**: ✅ FIXED

#### Description

Versions 1.0.0 through 1.0.4 contained a critical Cypher injection vulnerability in vector index operations. User-controlled input (index names, node labels, property names) was interpolated directly into Cypher queries without validation, allowing attackers to inject malicious Cypher commands.

#### Attack Vector

```javascript
// Malicious input
nodeLabel = "Chunk`) DELETE DETACH (n) //"

// Would generate malicious query
CREATE VECTOR INDEX `my_index` IF NOT EXISTS
FOR (n:Chunk`) DELETE DETACH (n) //) ON (n.embedding)

// Result: All nodes deleted from database
```

#### Impact

- **Confidentiality**: HIGH - Unauthorized data access possible
- **Integrity**: HIGH - Data modification/deletion possible
- **Availability**: HIGH - Database could be corrupted or made unavailable

#### Mitigation

**Upgrade immediately to v1.1.0 or later.**

Version 1.1.0 includes:
- Comprehensive input validation with regex pattern `/^[a-zA-Z_$][a-zA-Z0-9_$]*$/`
- Explicit backtick rejection
- DoS protection (255 character limit)
- Type and range validation for dimensions
- 10/10 penetration tests passed
- OWASP Top 10 compliant

#### Workaround (if upgrade not possible)

If immediate upgrade is not possible:
1. Restrict n8n workflow access to trusted users only
2. Validate all user inputs before passing to Neo4j operations
3. Monitor Neo4j logs for suspicious queries
4. **Upgrade as soon as possible**

## Reporting a Vulnerability

**Please DO NOT report security vulnerabilities via public GitHub issues.**

To report a security vulnerability:

1. **GitHub Security Advisory**: Use the "Security" tab in the repository
2. **Email**: Create a private security report
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Vulnerability Assessment**: Within 7 days
- **Fix Development**: Depends on severity (critical: <7 days)
- **Public Disclosure**: After fix is released and users have time to upgrade (typically 30 days)

## Security Best Practices

When using this plugin:

1. **Keep Updated**: Always use the latest version
2. **Access Control**: Limit n8n workflow access to trusted users
3. **Credential Management**: Use n8n's built-in credential system
4. **Input Validation**: Even with plugin validation, validate at workflow level
5. **Monitoring**: Enable Neo4j query logging for audit trails
6. **Principle of Least Privilege**: Use Neo4j credentials with minimum required permissions

## Security Features (v1.1.0+)

### Input Validation

All user inputs are validated with multiple layers:

1. **Pattern Validation**: Identifiers must match `/^[a-zA-Z_$][a-zA-Z0-9_$]*$/`
2. **Character Blocking**: Backticks explicitly rejected
3. **Length Limits**: Maximum 255 characters (DoS protection)
4. **Type Safety**: Dimensions must be integers
5. **Range Validation**: Dimensions must be 1-2048

### Error Handling

- Validation errors provide clear, user-friendly messages
- No sensitive information leaked in error messages
- Stack traces not exposed to end users

### Neo4j Integration

- Parameterized queries used where Neo4j supports them
- Validated interpolation for DDL operations (CREATE/DROP INDEX)
- Database parameter safely passed to Neo4j driver

## Acknowledgments

We thank the security research community for responsible disclosure practices.

---

**Last Updated**: 2025-10-02
