import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB

function sanitizeFilename(filename: string): string {
  // Strip path separators and non-ASCII/special characters
  const safeStr = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  // Truncate to reasonable length just in case
  return safeStr.substring(0, 100)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    const token = formData.get('token') as string | null
    const itemId = formData.get('itemId') as string | null
    const file = formData.get('file') as File | null
    
    if (!token || !itemId || !file) {
      return NextResponse.json({ error: 'Missing token, itemId, or file.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 15MB limit.' }, { status: 413 })
    }

    const sanitizedFilename = sanitizeFilename(file.name)
    const uuid = crypto.randomUUID()
    const storagePath = `${token}/${itemId}-${uuid}-${sanitizedFilename}`
    
    const serviceClient = createServiceRoleClient()

    // Upload to Storage using service role
    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await serviceClient.storage
      .from('document-uploads')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload failed:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file. Please try again later.' }, { status: 500 })
    }

    // Initialize anon client for RPC call
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase public environment variables')
    }
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)

    // Call RPC using anon client
    const { data: rpcResult, error: rpcError } = await anonClient.rpc('upload_document_item_via_token', {
      p_item_id: itemId,
      p_token: token,
      p_storage_path: storagePath
    })

    if (rpcError || !rpcResult) {
      // Cleanup orphaned file
      await serviceClient.storage.from('document-uploads').remove([storagePath])
      console.warn(`Upload RPC failed or rejected for item ${itemId}, file deleted.`, rpcError)
      return NextResponse.json({ error: 'Invalid token, item, or item status does not allow upload.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'File uploaded successfully.' })
    
  } catch (err) {
    console.error('Document upload route handler error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred during upload.' }, { status: 500 })
  }
}
