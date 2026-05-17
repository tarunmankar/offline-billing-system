export const generateReceiptHtml = (
  shopInfo: any, 
  cart: any[], 
  totals: any, 
  user: any, 
  format: 'thermal' | 'A4'
) => {
  const date = new Date().toLocaleString();
  const taxLabel = shopInfo?.tax_label || 'GST';

  if (format === 'thermal') {
    return `
      <div class="center bold" style="font-size: 16px;">${shopInfo?.name || 'SHOP'}</div>
      <div class="center">${shopInfo?.type || ''}</div>
      <div class="divider"></div>
      <div>Date: ${date}</div>
      <div>Cashier: ${user?.username || 'Admin'}</div>
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="right">Qty</th>
            <th class="right">Amt</th>
          </tr>
        </thead>
        <tbody>
          ${cart.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="right">${item.quantity}</td>
              <td class="right">${(item.quantity * item.rate).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="divider"></div>
      <table>
        <tr>
          <td>Taxable</td>
          <td class="right">${totals.taxableAmount.toFixed(2)}</td>
        </tr>
        ${Object.entries(totals.taxDetails).map(([k, v]: any) => `
          <tr>
            <td>${k}</td>
            <td class="right">${v.toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
      <div class="divider"></div>
      <div class="bold" style="display: flex; justify-content: space-between; font-size: 14px;">
        <span>TOTAL</span>
        <span>₹${totals.grandTotal.toFixed(2)}</span>
      </div>
      <div class="divider"></div>
      <div class="center" style="margin-top: 10px;">Thank You! Visit Again.</div>
    `;
  }

  // A4 Format
  return `
    <div class="header">
      <div class="title">${shopInfo?.name || 'SHOP'}</div>
      <div>${shopInfo?.type || ''}</div>
      <div>Invoice Date: ${date} | Cashier: ${user?.username || 'Admin'}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>S.No</th>
          <th>Product Name</th>
          <th class="right">Rate</th>
          <th class="right">Qty</th>
          <th class="right">Tax %</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${cart.map((item, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${item.name}</td>
            <td class="right">₹${item.rate.toFixed(2)}</td>
            <td class="right">${item.quantity}</td>
            <td class="right">${item.taxPercent}%</td>
            <td class="right">₹${(item.quantity * item.rate).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="margin-top: 30px; width: 300px; margin-left: auto;">
      <table style="margin-top: 0;">
        <tr>
          <td>Taxable Amount</td>
          <td class="right">₹${totals.taxableAmount.toFixed(2)}</td>
        </tr>
        ${Object.entries(totals.taxDetails).map(([k, v]: any) => `
          <tr>
            <td>${k}</td>
            <td class="right">₹${v.toFixed(2)}</td>
          </tr>
        `).join('')}
          <tr class="total-row">
            <td>Grand Total</td>
            <td class="right">₹${totals.grandTotal.toFixed(2)}</td>
          </tr>
        </table>
      </div>
      <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
        This is a computer-generated invoice.
      </div>
    `;
  };
