type DataRow = Record<string, any>;

function formatValueForCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString('es-ES');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

function arrayToCSV(data: DataRow[], headers?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }
  
  const columnHeaders = headers || Object.keys(data[0]);
  const headerRow = columnHeaders.join(',');
  
  const dataRows = data.map(row => {
    return columnHeaders.map(header => formatValueForCSV(row[header])).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\ufeff' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: DataRow[], filename: string, headers?: string[]) {
  const csvContent = arrayToCSV(data, headers);
  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${timestamp}.csv`;
  downloadFile(csvContent, fullFilename);
}

interface DashboardExportData {
  metrics?: Record<string, any>;
  rankings?: {
    byTeam?: any[];
    byPerson?: any[];
    bySource?: any[];
  };
  products?: any[];
  filters?: Record<string, any>;
}

export function exportDashboardToCSV(data: DashboardExportData) {
  const lines: string[] = [];
  const timestamp = new Date().toLocaleString('es-ES');
  
  lines.push('REPORTE DASHBOARD WISECX');
  lines.push(`Fecha de exportación: ${timestamp}`);
  lines.push('');
  
  if (data.filters && Object.keys(data.filters).length > 0) {
    lines.push('FILTROS APLICADOS');
    Object.entries(data.filters).forEach(([key, value]) => {
      lines.push(`${key}: ${value}`);
    });
    lines.push('');
  }
  
  if (data.metrics) {
    lines.push('MÉTRICAS PRINCIPALES');
    lines.push('Métrica,Valor,Cambio');
    
    const metricsOrder = ['revenue', 'closureRate', 'meetings', 'logos', 'avgSalesCycle', 'avgTicket'];
    metricsOrder.forEach(key => {
      const metric = data.metrics?.[key];
      if (metric) {
        const prefix = metric.prefix || '';
        const suffix = metric.suffix || '';
        const formattedValue = typeof metric.value === 'number' 
          ? `${prefix}${metric.value.toLocaleString('es-ES')}${suffix}`
          : `${prefix}${metric.value}${suffix}`;
        const change = metric.change !== undefined ? `${metric.change > 0 ? '+' : ''}${metric.change}%` : '';
        lines.push(`${metric.label || key},${formattedValue},${change}`);
      }
    });
    lines.push('');
  }
  
  if (data.rankings?.byTeam && data.rankings.byTeam.length > 0) {
    lines.push('TOP EQUIPOS');
    lines.push('Posición,Equipo,Valor');
    data.rankings.byTeam.forEach((item, index) => {
      lines.push(`${index + 1},${formatValueForCSV(item.name)},${item.valueFormatted || item.value}`);
    });
    lines.push('');
  }
  
  if (data.rankings?.byPerson && data.rankings.byPerson.length > 0) {
    lines.push('TOP EJECUTIVOS');
    lines.push('Posición,Ejecutivo,Valor');
    data.rankings.byPerson.forEach((item, index) => {
      lines.push(`${index + 1},${formatValueForCSV(item.name)},${item.valueFormatted || item.value}`);
    });
    lines.push('');
  }
  
  if (data.rankings?.bySource && data.rankings.bySource.length > 0) {
    lines.push('TOP ORÍGENES');
    lines.push('Posición,Origen,Valor');
    data.rankings.bySource.forEach((item, index) => {
      lines.push(`${index + 1},${formatValueForCSV(item.name)},${item.valueFormatted || item.value}`);
    });
    lines.push('');
  }
  
  if (data.products && data.products.length > 0) {
    lines.push('RENDIMIENTO POR PRODUCTO');
    lines.push('Producto,Unidades,Ingresos (USD),Promedio');
    data.products.forEach(product => {
      const revenue = typeof product.revenue === 'number' ? product.revenue.toLocaleString('es-ES') : product.revenue;
      const avgTicket = typeof product.averageTicket === 'number' ? product.averageTicket.toLocaleString('es-ES') : (product.averageTicket || '0');
      lines.push(`${formatValueForCSV(product.name)},${product.sold},$${revenue},$${avgTicket}`);
    });
  }
  
  const csvContent = lines.join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `wisecx_dashboard_${dateStr}.csv`);
}

export function exportToPDF() {
  window.print();
}
