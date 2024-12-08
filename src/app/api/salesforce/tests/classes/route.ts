import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const instance_url = searchParams.get('instance_url')

    if (!instance_url) {
        return NextResponse.json({ error: 'Missing instance URL' }, { status: 400 })
    }

    const authorization = request.headers.get('authorization')
    if (!authorization) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Get all active classes with a regular query
        const queryUrl = `${instance_url}/services/data/v59.0/tooling/query/?q=${encodeURIComponent(`
            SELECT Id, Name, Body, SymbolTable 
            FROM ApexClass 
            WHERE NamespacePrefix = null 
            AND Status = 'Active'
            ORDER BY Name
        `)}`;

        console.log('Making request to Salesforce:', { url: queryUrl });

        const response = await fetch(queryUrl, {
            headers: {
                Authorization: authorization,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error response from Salesforce:', data);
            return NextResponse.json(
                {
                    error: 'Salesforce API error',
                    details: data,
                },
                { status: response.status },
            );
        }

        // Get all classes first
        const classes = data.records;
        // Filter test classes by examining the Body content
        const testClasses = classes.filter((cls: { Body: string }) => cls.Body.includes('@isTest') || cls.Body.includes('@IsTest'));
        
        // Process and combine the results using SymbolTable to get test methods
        const classesWithMethods = testClasses.map((cls: { 
            Id: string, 
            Name: string, 
            SymbolTable: { 
                methods: { 
                    name: string,
                    annotations: { name: string }[] 
                }[] 
            } 
        }) => {
            const methods = cls.SymbolTable?.methods || []
            const testMethods = methods.filter((method) =>
                method.annotations?.some(
                    (ann) => ann.name === 'IsTest' || ann.name === 'isTest' || ann.name === 'testMethod',
                ),
            )

            return {
                Id: cls.Id,
                Name: cls.Name,
                testMethods: testMethods.map(method => method.name),
            }
        })

        return NextResponse.json(classesWithMethods)
    } catch (error) {
        console.error('Error in test classes route:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch test classes',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        )
    }
}
