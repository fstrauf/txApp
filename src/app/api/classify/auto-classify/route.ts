import { NextRequest, NextResponse } from 'next/server';
import { validateClassifyRequest, handleClassifyError } from '@/lib/classify-validation';
import { gunzipSync } from 'zlib';

const EXTERNAL_AUTO_CLASSIFY_URL = process.env.EXPENSE_SORTED_API + '/auto-classify';
const DEFAULT_API_KEY = process.env.EXPENSE_SORTED_API_KEY;

// Add timeout and size limits
const REQUEST_TIMEOUT = 300000; // 5 minutes timeout for large batches
const MAX_REQUEST_SIZE = 50 * 1024 * 1024; // 50MB max request size
const MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024; // 100MB max after decompression

export async function POST(request: NextRequest) {
  try {
    // Use the default API key for auto-classification (no authentication required)
    if (!DEFAULT_API_KEY) {
      console.error('EXPENSE_SORTED_DEFAULT_API_KEY environment variable is not configured.');
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
    }

    console.log('Processing auto-classification request with default API key');
    
    // Check content length to prevent oversized requests
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      console.error(`Request too large: ${contentLength} bytes (max: ${MAX_REQUEST_SIZE})`);
      return NextResponse.json({ 
        error: 'Request too large. Please split your transactions into smaller batches.',
        details: `Request size: ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB, Maximum: ${Math.round(MAX_REQUEST_SIZE / 1024 / 1024)}MB`
      }, { status: 413 });
    }
    
    // Check if request is compressed
    const contentEncoding = request.headers.get('content-encoding');
    const isCompressed = contentEncoding === 'gzip';
    
    console.log(`Request details: size=${contentLength}, compressed=${isCompressed}`);
    
    // Get and validate the payload from the incoming request with timeout
    let rawPayload: any;
    
    if (isCompressed) {
      // Handle compressed request body
      console.log('Processing compressed request body...');
      const compressedBuffer = await Promise.race([
        request.arrayBuffer(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Compressed request body read timeout')), 30000)
        )
      ]) as ArrayBuffer;
      
      try {
        const decompressed = gunzipSync(Buffer.from(compressedBuffer));
        
        // Check decompressed size
        if (decompressed.length > MAX_UNCOMPRESSED_SIZE) {
          return NextResponse.json({ 
            error: 'Decompressed request too large',
            details: `Decompressed size: ${Math.round(decompressed.length / 1024 / 1024)}MB, Maximum: ${Math.round(MAX_UNCOMPRESSED_SIZE / 1024 / 1024)}MB`
          }, { status: 413 });
        }
        
        rawPayload = JSON.parse(decompressed.toString('utf-8'));
        console.log(`Successfully decompressed: ${compressedBuffer.byteLength} → ${decompressed.length} bytes`);
      } catch (decompressionError) {
        console.error('Failed to decompress request:', decompressionError);
        return NextResponse.json({ 
          error: 'Failed to decompress request body',
          details: 'The compressed data appears to be corrupted or in an unsupported format'
        }, { status: 400 });
      }
    } else {
      // Handle regular JSON request body
      rawPayload = await Promise.race([
        request.json(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request body read timeout')), 30000)
        )
      ]) as any;
    }
    
    const validatedPayload = validateClassifyRequest(rawPayload);
    
    console.log(`Validated ${validatedPayload.transactions.length} transactions for auto-classification`);

    // Log transaction count for monitoring
    if (validatedPayload.transactions.length > 100) {
      console.warn(`Large batch detected: ${validatedPayload.transactions.length} transactions`);
    }

    // Call the external auto-classification service with the default API key and timeout
    console.log(`Proxying auto-classification request to ${EXTERNAL_AUTO_CLASSIFY_URL}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      // Prepare request body and headers
      const requestBody = JSON.stringify(validatedPayload);
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-API-Key': DEFAULT_API_KEY, // Use the default API key for public access
        'Accept': 'application/json',
        'User-Agent': 'ExpenseSorted-Proxy/1.0',
      };

      // Add compression if the request is large (>50KB) to reduce network load
      const requestSize = new TextEncoder().encode(requestBody).length;
      let externalResponse: Response;

      if (requestSize > 50000) { // 50KB threshold
        console.log(`Large request detected (${Math.round(requestSize/1024)}KB), using compression`);
        try {
          const { gzip } = await import('pako');
          const compressedData = gzip(requestBody, { level: 6 });
          const compressionRatio = ((requestSize - compressedData.length) / requestSize * 100).toFixed(1);
          
          console.log(`External request compressed: ${Math.round(requestSize/1024)}KB -> ${Math.round(compressedData.length/1024)}KB (${compressionRatio}% reduction)`);
          
          externalResponse = await fetch(EXTERNAL_AUTO_CLASSIFY_URL, {
            method: 'POST',
            headers: {
              ...requestHeaders,
              'Content-Encoding': 'gzip',
              'Content-Length': compressedData.length.toString(),
            },
            body: compressedData,
            signal: controller.signal,
          });
        } catch (compressionError) {
          console.warn('Failed to compress external request, using uncompressed:', compressionError);
          // Fall back to uncompressed
          externalResponse = await fetch(EXTERNAL_AUTO_CLASSIFY_URL, {
            method: 'POST',
            headers: requestHeaders,
            body: requestBody,
            signal: controller.signal,
          });
        }
      } else {
        externalResponse = await fetch(EXTERNAL_AUTO_CLASSIFY_URL, {
          method: 'POST',
          headers: requestHeaders,
          body: requestBody,
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      // Get response text first to handle empty responses
      const responseText = await externalResponse.text();
      
      // Handle empty response
      if (!responseText || responseText.trim() === '') {
        console.error('External auto-classification service returned empty response:', externalResponse.status);
        return NextResponse.json({ 
          error: 'Classification service returned empty response',
          details: `HTTP ${externalResponse.status}: The external service did not return any data`
        }, { status: externalResponse.status || 502 });
      }

      // Parse JSON with error handling
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Failed to parse JSON response from external service:', jsonError);
        console.error('Response text:', responseText.substring(0, 500)); // Log first 500 chars
        
        return NextResponse.json({ 
          error: 'Invalid response format from classification service',
          details: `The external service returned invalid JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown parsing error'}`
        }, { status: 502 });
      }

      if (!externalResponse.ok) {
         console.error('External auto-classification service error:', externalResponse.status, responseData);
         return NextResponse.json(responseData, { status: externalResponse.status });
      }

      // Handle async job submission (202) - return immediately for frontend polling
      if (externalResponse.status === 202 && responseData.prediction_id) {
        console.log('Auto-classification job submitted successfully, returning prediction_id for frontend polling:', responseData.prediction_id);
        return NextResponse.json({
          status: 'processing',
          prediction_id: responseData.prediction_id,
          message: responseData.message || 'Auto-classification job submitted successfully'
        }, { status: 202 });
      }

      console.log('External auto-classification service success:', responseData);
      return NextResponse.json(responseData);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          console.error('Auto-classification request timeout after', REQUEST_TIMEOUT, 'ms');
          const timeoutMessage = validatedPayload.transactions.length > 1000 
            ? `Request timeout with ${validatedPayload.transactions.length} transactions. Large batches may take longer to process.` 
            : 'Request timeout. The classification service took too long to respond.';
          const timeoutDetails = validatedPayload.transactions.length > 1000 
            ? 'For large datasets (>1000 transactions), the system uses compression to optimize transfer. If timeouts persist, try splitting into smaller batches.' 
            : 'The system uses compression for large datasets. Try again or split into smaller batches if issues persist.';
          
          return NextResponse.json({ 
            error: timeoutMessage,
            details: timeoutDetails
          }, { status: 504 });
        }
        
        if (fetchError.message.includes('ECONNRESET') || fetchError.message.includes('Connection reset')) {
          console.error('Connection reset error during auto-classification:', fetchError.message);
          return NextResponse.json({ 
            error: 'Connection error occurred during classification.',
            details: 'This usually happens with very large datasets. The system uses compression to reduce transfer size, but extremely large batches may still cause issues.'
          }, { status: 502 });
        }
      }
      
      throw fetchError; // Re-throw other errors to be handled by main catch block
    }

  } catch (error) {
    console.error('Error in /api/classify/auto-classify proxy:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Request validation failed')) {
        const errorInfo = handleClassifyError(error);
        return NextResponse.json({ 
          error: errorInfo.message,
          details: errorInfo.details 
        }, { status: errorInfo.status });
      }
      
      if (error.message.includes('Request body read timeout') || error.message.includes('Compressed request body read timeout')) {
        return NextResponse.json({ 
          error: 'Request timeout while reading data.',
          details: 'The request body was too large or took too long to process. The system uses compression to optimize large datasets, but try splitting into smaller batches if issues persist.'
        }, { status: 408 });
      }
      
      if (error.message.includes('ECONNRESET') || error.message.includes('Connection reset')) {
        return NextResponse.json({ 
          error: 'Connection reset during classification.',
          details: 'This usually happens with very large datasets. The system uses compression to reduce data size, but try splitting into smaller batches if issues persist.'
        }, { status: 502 });
      }
    }
    
    return NextResponse.json({ error: 'Internal Server Error during auto-classification proxy' }, { status: 500 });
  }
}

 