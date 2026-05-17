export const generateReceiptHtml = (
  shopInfo: any, 
  cart: any[], 
  totals: any, 
  user: any, 
  format: 'thermal' | 'A4'
) => {
  const date = new Date().toLocaleString('en-IN', { hour12: true });
  const invoiceNo = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

  if (format === 'thermal') {
    return `
      <style>
        .thermal-box {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          color: #000;
          line-height: 1.3;
        }
        .thermal-header {
          text-align: center;
          margin-bottom: 10px;
        }
        .thermal-title {
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .thermal-subtitle {
          font-size: 10px;
          color: #333;
        }
        .thermal-divider {
          border-bottom: 1px dashed #000;
          margin: 6px 0;
        }
        .thermal-double-divider {
          border-bottom: 3px double #000;
          margin: 6px 0;
        }
        .thermal-table {
          width: 100%;
          border-collapse: collapse;
        }
        .thermal-table th {
          border-bottom: 1px dashed #000;
          padding-bottom: 4px;
          font-weight: bold;
          text-align: left;
        }
        .thermal-table td {
          padding: 3px 0;
          vertical-align: top;
        }
        .right {
          text-align: right;
        }
        .bold {
          font-weight: bold;
        }
        .thermal-footer {
          text-align: center;
          margin-top: 15px;
          font-size: 10px;
        }
      </style>

      <div class="thermal-box">
        <div class="thermal-header">
          <div class="thermal-title">${shopInfo?.name || 'BILLING PRO'}</div>
          <div class="thermal-subtitle">${shopInfo?.type || 'RETAIL TERMINAL'}</div>
          ${shopInfo?.address ? `<div style="font-size: 9px; margin-top: 2px;">${shopInfo.address}</div>` : ''}
          ${shopInfo?.phone ? `<div style="font-size: 9px;">Ph: ${shopInfo.phone}</div>` : ''}
          ${shopInfo?.gstin ? `<div style="font-size: 9px; font-weight: bold; margin-top: 2px;">GSTIN: ${shopInfo.gstin}</div>` : ''}
          ${shopInfo?.dl_number ? `<div style="font-size: 9px;">D.L. No: ${shopInfo.dl_number}</div>` : ''}
        </div>

        <div class="thermal-divider"></div>
        <div>Date: ${date}</div>
        <div>Receipt ID: ${txnId}</div>
        <div>Cashier: ${user?.username || 'Admin'}</div>
        <div class="thermal-divider"></div>

        <table class="thermal-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th class="right">Qty</th>
              <th class="right">Price</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map(item => `
              <tr>
                <td>
                  <div>${item.name}</div>
                  <div style="font-size: 8px; color: #555;">Exp: ${item.expiry || 'N/A'} | Batch: ${item.batch || 'N/A'}</div>
                </td>
                <td class="right">${item.quantity}</td>
                <td class="right">${(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="thermal-divider"></div>

        <table style="width: 100%; font-size: 11px;">
          <tr>
            <td>Taxable Amount:</td>
            <td class="right">₹${totals.taxableAmount.toFixed(2)}</td>
          </tr>
          ${Object.entries(totals.taxDetails).map(([k, v]: any) => `
            <tr>
              <td>${k}:</td>
              <td class="right">₹${v.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>

        <div class="thermal-double-divider"></div>

        <table style="width: 100%; font-size: 13px;" class="bold">
          <tr>
            <td>NET PAYABLE:</td>
            <td class="right">₹${totals.grandTotal.toFixed(2)}</td>
          </tr>
        </table>

        <div class="thermal-double-divider"></div>

        <div class="thermal-footer">
          <div class="bold" style="text-transform: uppercase;">${shopInfo?.return_policy || 'Thank You! Visit Again'}</div>
          <div style="margin-top: 4px; font-size: 8px;">Powered by Billing Pro Suite</div>
        </div>
      </div>
    `;
  }

  // A4 Invoice Format
  return `
    <style>
      .invoice-box {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        color: #1e293b;
        line-height: 1.5;
      }
      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 20px;
        margin-bottom: 25px;
      }
      .brand-title {
        font-size: 28px;
        font-weight: 800;
        color: #2563eb;
        letter-spacing: -0.5px;
        text-transform: uppercase;
      }
      .brand-subtitle {
        font-size: 12px;
        color: #64748b;
        font-weight: 600;
        margin-top: -4px;
      }
      .invoice-meta-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 30px;
      }
      .meta-card {
        background: #f8fafc;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #f1f5f9;
      }
      .meta-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
      }
      .meta-content {
        font-size: 13px;
        color: #1e293b;
        line-height: 1.6;
      }
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        font-size: 13px;
      }
      .invoice-table th {
        background-color: #1e293b !important;
        color: #ffffff !important;
        font-weight: 600;
        padding: 12px 14px;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.5px;
        border: none;
      }
      .invoice-table td {
        padding: 12px 14px;
        border-bottom: 1px solid #e2e8f0;
      }
      .invoice-table tr:nth-child(even) {
        background-color: #f8fafc;
      }
      .right {
        text-align: right;
      }
      .totals-box {
        margin-top: 30px;
        width: 320px;
        margin-left: auto;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        padding: 16px;
      }
      .totals-table {
        width: 100%;
        border-collapse: collapse;
      }
      .totals-table td {
        padding: 6px 0;
        font-size: 13px;
        color: #64748b;
      }
      .totals-table tr.grand-total-row td {
        border-top: 2px solid #e2e8f0;
        font-weight: bold;
        font-size: 16px;
        color: #1e293b;
        padding-top: 10px;
      }
      .footer-note {
        margin-top: 60px;
        text-align: center;
        font-size: 12px;
        color: #94a3b8;
        border-top: 1px solid #e2e8f0;
        padding-top: 20px;
      }
    </style>

    <div class="invoice-box">
      <div class="invoice-header">
        <div>
          <div class="brand-title">${shopInfo?.name || 'BILLING PRO'}</div>
          <div class="brand-subtitle">${shopInfo?.type || 'RETAIL STORE'}</div>
          ${shopInfo?.gstin ? `<div style="font-size: 12px; font-weight: 600; color: #475569; margin-top: 8px;">GSTIN: ${shopInfo.gstin}</div>` : ''}
        </div>
        <div style="text-align: right;">
          <div style="font-size: 22px; font-weight: 700; color: #1e293b;">INVOICE</div>
          <div style="font-size: 13px; color: #64748b; margin-top: 4px;">No: ${invoiceNo}</div>
          <div style="font-size: 13px; color: #64748b;">Date: ${date}</div>
        </div>
      </div>

      <div class="invoice-meta-grid">
        <div class="meta-card">
          <div class="meta-title">Seller Details</div>
          <div class="meta-content">
            <strong>${shopInfo?.name || 'Billing Pro Outlet'}</strong><br/>
            ${shopInfo?.address || 'Physical Store Address Not Set'}<br/>
            ${shopInfo?.phone ? `Contact: ${shopInfo.phone}<br/>` : ''}
            ${shopInfo?.dl_number ? `D.L. Number: <strong>${shopInfo.dl_number}</strong><br/>` : ''}
          </div>
        </div>
        <div class="meta-card">
          <div class="meta-title">Billing Info</div>
          <div class="meta-content">
            <strong>B2C Customer / Walk-In</strong><br/>
            Cashier: ${user?.username || 'Admin'}<br/>
            Status: Fully Paid (Cash/UPI)
          </div>
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th style="width: 5%; border-top-left-radius: 6px;">#</th>
            <th style="text-align: left;">Item Description</th>
            <th class="right" style="width: 20%;">Batch & Expiry</th>
            <th class="right" style="width: 15%;">Rate</th>
            <th class="right" style="width: 10%;">Qty</th>
            <th class="right" style="width: 15%;">Tax %</th>
            <th class="right" style="width: 20%; border-top-right-radius: 6px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${cart.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>
                <div style="font-weight: 600; color: #1e293b;">${item.name}</div>
                ${item.barcode ? `<div style="font-size: 10px; color: #64748b;">Code: ${item.barcode}</div>` : ''}
              </td>
              <td class="right" style="font-family: monospace; color: #475569;">
                <div>B: ${item.batch || 'N/A'}</div>
                <div style="font-size: 11px; color: #64748b;">E: ${item.expiry || 'N/A'}</div>
              </td>
              <td class="right">₹${item.rate.toFixed(2)}</td>
              <td class="right">${item.quantity}</td>
              <td class="right">${item.taxPercent}%</td>
              <td class="right" style="font-weight: 600;">₹${(item.quantity * item.rate).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-box">
        <table class="totals-table">
          <tr>
            <td>Taxable Amount</td>
            <td class="right" style="font-weight: 600;">₹${totals.taxableAmount.toFixed(2)}</td>
          </tr>
          ${Object.entries(totals.taxDetails).map(([k, v]: any) => `
            <tr>
              <td>${k}</td>
              <td class="right">₹${v.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr class="grand-total-row">
            <td>Grand Total</td>
            <td class="right">₹${totals.grandTotal.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div class="footer-note">
        <div style="font-weight: bold; color: #475569; margin-bottom: 6px; text-transform: uppercase;">
          ${shopInfo?.return_policy || 'Thank you for your business!'}
        </div>
        <div>This is a computer-generated invoice and requires no physical signature.</div>
      </div>
    </div>
  `;
};
