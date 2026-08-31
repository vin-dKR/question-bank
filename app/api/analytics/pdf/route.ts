import { NextResponse } from 'next/server'
import { htmlTopdfBlob } from '@/actions/htmlToPdf/htmlToPdf'
import { AuthError, requireApiActor } from '@/lib/auth/guard'
import { clientIp, enforceRateLimit, RateLimitError } from '@/lib/ratelimit'

/**
 * SECURITY (docs/API_SECURITY.md): this route renders caller-supplied HTML in
 * a headless browser. It was previously UNAUTHENTICATED, making it an anonymous
 * SSRF + DoS surface. It now requires an actor, is rate-limited (Puppeteer is
 * expensive), and htmlTopdfBlob blocks requests to internal/metadata hosts so
 * attacker HTML can't pivot inward.
 */
export async function POST(request: Request) {
	try {
		const actor = await requireApiActor(request)
		const rateKey =
			actor.kind === 'user' ? `user:${actor.user.userId}` : `svc:${clientIp(request)}`
		await enforceRateLimit('pdf', rateKey)

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
	} catch (error) {
		if (error instanceof AuthError) {
			const res = NextResponse.json({ error: error.message }, { status: error.status })
			if (error instanceof RateLimitError) {
				res.headers.set('Retry-After', String(error.retryAfterSeconds))
			}
			return res
		}
		return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
	}
}


