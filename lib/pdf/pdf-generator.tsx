import React from 'react';
import path from 'path';
import { Document, Page, Text, View, StyleSheet, Font, renderToStream } from '@react-pdf/renderer';
import { formatValue } from '@/components/cma/utils';

// Register a Google font for Rupee symbol support
Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf') },
    { src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf'), fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 9,
    color: '#333',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportType: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  confidential: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d32f2f', // A muted red for confidential
  },
  date: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  scheduleContainer: {
    marginBottom: 20,
  },
  scheduleTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 24,
    alignItems: 'center',
  },
  tableHeaderRow: {
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  cellMetric: {
    flex: 3,
    padding: 4,
    paddingLeft: 8,
  },
  cellValue: {
    flex: 1,
    padding: 4,
    paddingRight: 8,
    textAlign: 'right',
  },
  textBold: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
});

interface PdfDocumentProps {
  clientName: string;
  reportType: string;
  generatedDate: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schedules: any[];
}

const ReportDocument = ({ clientName, reportType, generatedDate, schedules }: PdfDocumentProps) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.clientName}>{clientName}</Text>
            <Text style={styles.reportType}>{reportType.toUpperCase()} Report</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.confidential}>CONFIDENTIAL</Text>
            <Text style={styles.date}>Generated: {generatedDate}</Text>
          </View>
        </View>

        {schedules.map((schedule, idx) => (
          <View key={idx} style={styles.scheduleContainer} wrap={false}>
            <Text style={styles.scheduleTitle}>{schedule.scheduleTitle}</Text>
            <View style={styles.table}>
              {/* Header Row */}
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <View style={styles.cellMetric}>
                  <Text style={styles.textBold}>Metric</Text>
                </View>
                {schedule.columns.map((col: string, colIdx: number) => (
                  <View key={colIdx} style={styles.cellValue}>
                    <Text style={styles.textBold}>{col}</Text>
                  </View>
                ))}
              </View>

              {/* Data Rows */}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {schedule.rows.map((row: any, rowIdx: number) => {
                const isHeaderLike = row.isHeader || row.isSubTotal;
                
                // Construct cells
                const dataCells = [];

                if (row.historicalValue !== undefined) {
                   const displayVal = typeof row.historicalValue === 'number'
                     ? formatValue(row.historicalValue, row.valueType)
                     : String(row.historicalValue);
                   dataCells.push(displayVal);
                }

                if (row.projectedValues) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  row.projectedValues.forEach((val: any) => {
                     let displayVal = '-';
                     if (val && val.value !== undefined) {
                       displayVal = formatValue(val.value, row.valueType);
                     }
                     dataCells.push(displayVal);
                  });
                } else if (row.value !== undefined) {
                  let rawVal = row.value;
                  if (rawVal && typeof rawVal === 'object' && 'value' in rawVal) {
                    rawVal = rawVal.value;
                  }
                  
                  const displayVal = row.isCustom 
                      ? row.customValue 
                      : formatValue(Number(rawVal), row.valueType);
                  dataCells.push(displayVal);
                }

                return (
                  <View key={rowIdx} style={styles.tableRow} wrap={false}>
                    <View style={styles.cellMetric}>
                      <Text style={isHeaderLike ? styles.textBold : {}}>
                        {(row.indent ? '    ' : '') + row.label}
                      </Text>
                    </View>
                    {dataCells.map((valStr, cellIdx) => (
                      <View key={cellIdx} style={styles.cellValue}>
                        <Text style={isHeaderLike ? styles.textBold : {}}>
                          {valStr}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} />
      </Page>
    </Document>
  );
};

export async function generateReportPDF(data: PdfDocumentProps): Promise<Buffer> {
  const stream = await renderToStream(<ReportDocument {...data} />);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
