/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapCMAReportSchedules } from '@/lib/report-mappers/cma-mapper';
import { mapFeasibilityReport } from '@/lib/report-mappers/feasibility-mapper';
import { mapFinancialHealthReport } from '@/lib/report-mappers/financial-health-mapper';
import { formatValue } from '@/components/cma/utils';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType } from 'docx';
import ExcelJS from 'exceljs';
import { CMAHistoricalInput, CMAProjectedYear } from '@/lib/pipelines/cma';
import { generateReportPDF } from '@/lib/pdf/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const reportType = searchParams.get('type');
  const format = searchParams.get('format');
  const clientId = params.id;

  if (!reportType || !['cma', 'feasibility', 'health'].includes(reportType)) {
    return NextResponse.json({ error: 'Invalid or missing report type' }, { status: 400 });
  }

  if (!format || !['docx', 'xlsx', 'pdf'].includes(format)) {
    return NextResponse.json({ error: 'Invalid or missing format (docx, xlsx, pdf)' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate Auth / RLS (Querying client's report will naturally fail if unauthorized)
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('company_name')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 });
  }

  // Map public API type parameter to internal DB enum values
  const dbReportType = reportType === 'health' ? 'financial_health' : reportType;

  // Fetch the LATEST report of the requested type
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('client_id', clientId)
    .eq('report_type', dbReportType)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: `No ${reportType} report found for this client.` }, { status: 404 });
  }

  // Extract Schedules using the mappers
  let schedules: any[] = [];
  const outputData = report.output_data as any;

  try {
    if (reportType === 'cma') {
      const historical = outputData.historical as CMAHistoricalInput | null;
      const projections = outputData.baseCase?.projections as CMAProjectedYear[] || [];
      // If we want to strictly export the base case, we use baseCase.projections
      schedules = mapCMAReportSchedules(historical, projections);
    } else if (reportType === 'feasibility') {
      const mapped = mapFeasibilityReport(outputData);
      schedules = mapped.schedules;
    } else if (reportType === 'health') {
      const mapped = mapFinancialHealthReport(outputData);
      schedules = mapped.schedules;
    }
  } catch (err) {
    console.error('Mapping error:', err);
    return NextResponse.json({ error: 'Failed to map report data for export' }, { status: 500 });
  }

  const generatedDate = new Date(report.created_at).toLocaleDateString();
  const filename = `${client.company_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${reportType}-${generatedDate.replace(/\//g, '-')}.${format}`;

  if (format === 'docx') {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: client.company_name,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `${reportType.toUpperCase()} Report - Confidential`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Generated on ${generatedDate}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          ...schedules.flatMap(schedule => {
            const tableRows = [
              // Header Row
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Metric', bold: true })] })],
                    shading: { fill: 'F3F4F6' }
                  }),
                  ...schedule.columns.map((col: string) => new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: col, bold: true })], alignment: AlignmentType.RIGHT })],
                    shading: { fill: 'F3F4F6' }
                  }))
                ]
              }),
              // Data Rows
              ...schedule.rows.map((row: any) => {
                const labelRun = new TextRun({ 
                  text: (row.indent ? '    ' : '') + row.label, 
                  bold: row.isHeader || row.isSubTotal 
                });
                
                const cells = [
                  new TableCell({
                    children: [new Paragraph({ children: [labelRun] })],
                  })
                ];

                if (row.historicalValue !== undefined) {
                   const displayVal = typeof row.historicalValue === 'number'
                     ? formatValue(row.historicalValue, row.valueType, row.currencyDecimals)
                     : String(row.historicalValue);
                   cells.push(new TableCell({
                     children: [new Paragraph({ text: displayVal, alignment: AlignmentType.RIGHT })]
                   }));
                }

                if (row.projectedValues) {
                  row.projectedValues.forEach((val: any) => {
                     let displayVal = '-';
                     if (val && val.value !== undefined) {
                       displayVal = formatValue(val.value, row.valueType, row.currencyDecimals);
                     }
                     cells.push(new TableCell({
                       children: [new Paragraph({ text: displayVal, alignment: AlignmentType.RIGHT })]
                     }));
                  });
                } else if (row.value !== undefined) {
                  let rawVal = row.value;
                  if (rawVal && typeof rawVal === 'object' && 'value' in rawVal) {
                    rawVal = rawVal.value;
                  }
                  const displayVal = row.isCustom ? row.customValue : formatValue(Number(rawVal), row.valueType, row.currencyDecimals);
                  cells.push(new TableCell({
                    children: [new Paragraph({ text: displayVal, alignment: AlignmentType.RIGHT })]
                  }));
                }

                return new TableRow({ children: cells });
              })
            ];

            return [
              new Paragraph({
                text: schedule.scheduleTitle,
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 400, after: 200 }
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: tableRows
              })
            ];
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } else if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    let currentRow = 1;

    worksheet.getCell(`A${currentRow}`).value = client.company_name;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `${reportType.toUpperCase()} Report - Confidential (Generated on ${generatedDate})`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow += 2;

    schedules.forEach(schedule => {
      // Title
      worksheet.getCell(`A${currentRow}`).value = schedule.scheduleTitle;
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      currentRow++;

      // Headers
      const headers = ['Metric', ...schedule.columns];

      const headerRow = worksheet.getRow(currentRow);
      headerRow.values = headers;
      headerRow.font = { bold: true };
      currentRow++;

      // Rows
      schedule.rows.forEach((row: any) => {
        const rowData: any[] = [(row.indent ? '    ' : '') + row.label];
        
        if (row.historicalValue !== undefined) {
           rowData.push(row.historicalValue === '-' ? null : row.historicalValue);
        }
        
        if (row.projectedValues) {
          row.projectedValues.forEach((val: any) => {
            if (val && val.value !== undefined) {
              rowData.push(val.value);
            } else {
              rowData.push(null);
            }
          });
        } else if (row.value !== undefined) {
           let rawVal = row.value;
           if (rawVal && typeof rawVal === 'object' && 'value' in rawVal) {
             rawVal = rawVal.value;
           }
           rowData.push(rawVal);
        } else if (row.customValue !== undefined) {
           rowData.push(row.customValue);
        }

        const excelRow = worksheet.getRow(currentRow);
        excelRow.values = rowData;
        
        if (row.isHeader || row.isSubTotal) {
          excelRow.font = { bold: true };
        }

        // Format numeric cells
        excelRow.eachCell((cell, colNumber) => {
          if (colNumber > 1 && typeof cell.value === 'number') {
            if (row.valueType === 'currency') {
              if (row.currencyDecimals === 2) {
                cell.numFmt = '[$₹-en-IN]#,##0.00;[Red][$₹-en-IN]-#,##0.00';
              } else {
                cell.numFmt = '[$₹-en-IN]#,##0;[Red][$₹-en-IN]-#,##0';
              }
            } else if (row.valueType === 'percentage') {
              cell.numFmt = '0.00%';
              // Convert value to decimal for Excel percentage formatting if it's not already
              cell.value = (cell.value as number) / 100;
            } else {
              cell.numFmt = '0.00';
            }
          }
        });

        currentRow++;
      });

      currentRow += 2; // Blank row between schedules
    });

    worksheet.columns.forEach(column => {
      column.width = 30;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } else if (format === 'pdf') {
    const pdfBuffer = await generateReportPDF({
      clientName: client.company_name,
      reportType: reportType,
      generatedDate: generatedDate,
      schedules: schedules
    });
    
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
}
