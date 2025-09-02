import { NextResponse } from 'next/server'
import { htmlTopdfBlob } from '@/actions/htmlToPdf/htmlToPdf'

export async function POST(request: Request) {
	try {
		const { html, filename } = await request.json()
		if (!html || typeof html !== 'string') {
			return NextResponse.json({ error: 'Invalid html' }, { status: 400 })
		}

		const { data, error, errorMessage } = await htmlTopdfBlob(html)
		if (error || !data) {
			return NextResponse.json({ error: errorMessage || 'Failed to generate PDF' }, { status: 500 })
		}

		return new NextResponse(data as unknown as BodyInit, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${(filename || 'analytics').replace(/[^a-zA-Z0-9_-]/g, '')}.pdf"`,
			},
		})
	} catch {
		return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
	}
}


