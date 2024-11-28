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
        // First try to get all active classes
        const compositeRequest = {
            compositeRequest: [
                {
                    method: 'GET',
                    url:
                        '/services/data/v59.0/tooling/query/?q=' +
                        encodeURIComponent(`
            SELECT Id, Name, Body, SymbolTable 
            FROM ApexClass 
            WHERE NamespacePrefix = null 
            AND Status = 'Active'
            ORDER BY Name
          `),
                    referenceId: 'testClasses',
                },
            ],
        }

        console.log('Making request to Salesforce:', {
            url: `${instance_url}/services/data/v59.0/tooling/composite`,
            compositeRequest,
        })

        const response = await fetch(`${instance_url}/services/data/v59.0/tooling/composite`, {
            method: 'POST',
            headers: {
                Authorization: authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(compositeRequest),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Error response from Salesforce:', data)
            return NextResponse.json(
                {
                    error: 'Salesforce API error',
                    details: data,
                },
                { status: response.status },
            )
        }

        // Check for errors in composite response
        if (data.compositeResponse[0].httpStatusCode >= 400) {
            console.error('Error in composite response:', data.compositeResponse[0])
            return NextResponse.json(
                {
                    error: 'Salesforce query error',
                    details: data.compositeResponse[0].body,
                },
                { status: data.compositeResponse[0].httpStatusCode },
            )
        }

        // Get all classes first
        const classes = data.compositeResponse[0].body.records
        // Filter test classes by examining the Body content
        const testClasses = classes.filter((cls: { Body: string }) => cls.Body.includes('@isTest') || cls.Body.includes('@IsTest'))

        // Now get the methods for just the test classes
        const testClassIds = testClasses.map((cls: { Id: string }) => `'${cls.Id}'`).join(',')

        if (testClassIds.length === 0) {
            return NextResponse.json([])
        }

        const methodsResponse = await fetch(
            `${instance_url}/services/data/v59.0/tooling/query/?q=` +
                encodeURIComponent(`
        SELECT Id, Name, SymbolTable 
        FROM ApexClass 
        WHERE Id IN (${testClassIds})
      `),
            {
                headers: {
                    Authorization: authorization,
                },
            },
        )

        const methodsData = await methodsResponse.json()

        if (!methodsResponse.ok) {
            console.error('Error fetching methods:', methodsData)
            return NextResponse.json(
                {
                    error: 'Failed to fetch test methods',
                    details: methodsData,
                },
                { status: methodsResponse.status },
            )
        }

        // Process and combine the results using SymbolTable to get test methods
        const classesWithMethods = testClasses.map((cls: { Id: string, Name: string, SymbolTable: { methods: { annotations: { name: string }[] }[] } }) => {
            const methods = cls.SymbolTable?.methods || []
            const testMethods = methods.filter((method) =>
                method.annotations?.some(
                    (ann) => ann.name === 'IsTest' || ann.name === 'isTest' || ann.name === 'testMethod',
                ),
            )

            return {
                Id: cls.Id,
                Name: cls.Name,
                testMethods: testMethods.map((method) => method.annotations.map(ann => ann.name)),
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
