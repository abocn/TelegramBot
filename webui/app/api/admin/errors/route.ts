import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { and, gte, desc, count, eq, or, like, inArray } from 'drizzle-orm'
import { requireAdmin, createAuthResponse } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    const authResponse = createAuthResponse(authResult)

    if (authResponse) {
      return authResponse
    }

    if (!authResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source') || 'all'
    const timeframe = searchParams.get('timeframe') || '7d'
    const status = searchParams.get('status') || 'all'
    const severity = searchParams.get('severity') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const command = searchParams.get('command') || ''

    const now = new Date()
    const startDate = new Date()

    switch (timeframe) {
      case '1h':
        startDate.setHours(now.getHours() - 1)
        break
      case '24h':
        startDate.setDate(now.getDate() - 1)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case 'all':
        startDate.setFullYear(2020)
        break
    }

    const botErrorConditions = []
    botErrorConditions.push(gte(schema.botErrorsTable.createdAt, startDate))

    if (status === 'resolved') {
      botErrorConditions.push(eq(schema.botErrorsTable.resolved, true))
    } else if (status === 'unresolved') {
      botErrorConditions.push(eq(schema.botErrorsTable.resolved, false))
    }

    if (severity !== 'all') {
      botErrorConditions.push(eq(schema.botErrorsTable.severity, severity))
    }

    if (command) {
      botErrorConditions.push(eq(schema.botErrorsTable.commandName, command))
    }

    if (search) {
      botErrorConditions.push(
        or(
          like(schema.botErrorsTable.errorMessage, `%${search}%`),
          like(schema.botErrorsTable.errorType, `%${search}%`)
        )
      )
    }

    const telegramErrorConditions = []
    telegramErrorConditions.push(gte(schema.telegramErrorsTable.createdAt, startDate))

    if (status === 'resolved') {
      telegramErrorConditions.push(eq(schema.telegramErrorsTable.resolved, true))
    } else if (status === 'unresolved') {
      telegramErrorConditions.push(eq(schema.telegramErrorsTable.resolved, false))
    }

    if (search) {
      telegramErrorConditions.push(
        like(schema.telegramErrorsTable.errorDescription, `%${search}%`)
      )
    }

    let errors: (typeof schema.botErrorsTable.$inferSelect | typeof schema.telegramErrorsTable.$inferSelect)[] = []
    let totalCount = 0

    if (source === 'bot') {
      const botErrors = await db
        .select()
        .from(schema.botErrorsTable)
        .where(and(...botErrorConditions))
        .orderBy(desc(schema.botErrorsTable.createdAt))
        .limit(limit)
        .offset((page - 1) * limit)

      const [botCountResult] = await db
        .select({ count: count() })
        .from(schema.botErrorsTable)
        .where(and(...botErrorConditions))

      errors = botErrors
      totalCount = botCountResult.count
    } else if (source === 'telegram') {
      const telegramErrors = await db
        .select()
        .from(schema.telegramErrorsTable)
        .where(and(...telegramErrorConditions))
        .orderBy(desc(schema.telegramErrorsTable.createdAt))
        .limit(limit)
        .offset((page - 1) * limit)

      const telegramErrorsWithPrefix = telegramErrors.map(error => ({
        ...error,
        id: `tg_${error.id}`
      }))

      const [telegramCountResult] = await db
        .select({ count: count() })
        .from(schema.telegramErrorsTable)
        .where(and(...telegramErrorConditions))

      errors = telegramErrorsWithPrefix
      totalCount = telegramCountResult.count
    } else if (source === 'all') {
      const extraBuffer = Math.max(limit * 3, 200)

      const [botErrors, telegramErrors] = await Promise.all([
        db.select()
          .from(schema.botErrorsTable)
          .where(and(...botErrorConditions))
          .orderBy(desc(schema.botErrorsTable.createdAt))
          .limit(extraBuffer),

        db.select()
          .from(schema.telegramErrorsTable)
          .where(and(...telegramErrorConditions))
          .orderBy(desc(schema.telegramErrorsTable.createdAt))
          .limit(extraBuffer)
      ])

      const [[botCountResult], [telegramCountResult]] = await Promise.all([
        db.select({ count: count() })
          .from(schema.botErrorsTable)
          .where(and(...botErrorConditions)),

        db.select({ count: count() })
          .from(schema.telegramErrorsTable)
          .where(and(...telegramErrorConditions))
      ])

      const telegramErrorsWithPrefix = telegramErrors.map(error => ({
        ...error,
        id: `tg_${error.id}`
      }))

      const allErrors = [...botErrors, ...telegramErrorsWithPrefix]
      allErrors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      const startIndex = (page - 1) * limit
      errors = allErrors.slice(startIndex, startIndex + limit)

      totalCount = botCountResult.count + telegramCountResult.count
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalErrorsResult] = await db
      .select({ count: count() })
      .from(schema.botErrorsTable)
    const [unresolvedErrorsResult] = await db
      .select({ count: count() })
      .from(schema.botErrorsTable)
      .where(eq(schema.botErrorsTable.resolved, false))
    const [resolvedTodayResult] = await db
      .select({ count: count() })
      .from(schema.botErrorsTable)
      .where(and(
        eq(schema.botErrorsTable.resolved, true),
        gte(schema.botErrorsTable.resolvedAt, today)
      ))
    const [criticalErrorsResult] = await db
      .select({ count: count() })
      .from(schema.botErrorsTable)
      .where(and(
        eq(schema.botErrorsTable.severity, 'critical'),
        eq(schema.botErrorsTable.resolved, false)
      ))

    const stats = {
      totalErrors: totalErrorsResult.count,
      unresolvedErrors: unresolvedErrorsResult.count,
      resolvedToday: resolvedTodayResult.count,
      criticalErrors: criticalErrorsResult.count
    }

    return NextResponse.json({
      errors,
      stats,
      totalCount,
      page,
      limit
    })
  } catch (error) {
    console.error('[! /api/admin/errors GET] Error fetching errors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    const authResponse = createAuthResponse(authResult)

    if (authResponse) {
      return authResponse
    }

    if (!authResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let body;
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('[! /api/admin/errors PATCH] JSON parsing error:', jsonError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { ids, action } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid IDs provided' }, { status: 400 })
    }

    if (action !== 'resolve' && action !== 'unresolve') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const resolved = action === 'resolve'
    const resolvedAt = resolved ? new Date() : null

    const botErrorIds = ids.filter(id => !id.startsWith('tg_'))
    if (botErrorIds.length > 0) {
      await db
        .update(schema.botErrorsTable)
        .set({
          resolved,
          resolvedAt
        })
        .where(inArray(schema.botErrorsTable.id, botErrorIds))
    }

    const telegramErrorIds = ids.filter(id => id.startsWith('tg_')).map(id => id.replace('tg_', ''))
    if (telegramErrorIds.length > 0) {
      await db
        .update(schema.telegramErrorsTable)
        .set({ resolved })
        .where(inArray(schema.telegramErrorsTable.id, telegramErrorIds))
    }

    return NextResponse.json({ success: true, updated: ids.length })
  } catch (error) {
    console.error('[! /api/admin/errors PATCH] Error updating errors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    const authResponse = createAuthResponse(authResult)

    if (authResponse) {
      return authResponse
    }

    if (!authResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let body;
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('[! /api/admin/errors DELETE] JSON parsing error:', jsonError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid IDs provided' }, { status: 400 })
    }

    const botErrorIds = ids.filter(id => !id.startsWith('tg_'))
    if (botErrorIds.length > 0) {
      await db
        .delete(schema.botErrorsTable)
        .where(inArray(schema.botErrorsTable.id, botErrorIds))
    }

    const telegramErrorIds = ids.filter(id => id.startsWith('tg_')).map(id => id.replace('tg_', ''))
    if (telegramErrorIds.length > 0) {
      await db
        .delete(schema.telegramErrorsTable)
        .where(inArray(schema.telegramErrorsTable.id, telegramErrorIds))
    }

    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (error) {
    console.error('[! /api/admin/errors DELETE] Error deleting errors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}