import { apiRequest, showToast } from './api.js';
import { checkAuth } from './auth.js';
let allPayments = [];
let allMembers = [];
let allPlans = [];
export async function initPayments() {
    if (!checkAuth())
        return;
    await Promise.all([loadPayments(), loadMembersAndPlans()]);
    setupEventListeners();
}
async function loadMembersAndPlans() {
    try {
        const [memRes, planRes] = await Promise.all([
            apiRequest('/members'),
            apiRequest('/memberships')
        ]);
        if (memRes.success) {
            allMembers = memRes.data;
            populateMemberDropdown();
        }
        if (planRes.success) {
            allPlans = planRes.data;
            populatePlanDropdown();
        }
    }
    catch (e) {
        console.error(e);
    }
}
function populateMemberDropdown() {
    const select = document.getElementById('payment-member-select');
    if (select) {
        select.innerHTML = '<option value="">Select Athlete...</option>' + allMembers.map(m => `
      <option value="${m.id}" data-plan="${m.membershipPlan}">${m.name} (${m.id}) - Current: ${m.membershipPlan}</option>
    `).join('');
        select.addEventListener('change', () => {
            const selectedOption = select.options[select.selectedIndex];
            const memberPlan = selectedOption.getAttribute('data-plan');
            if (memberPlan) {
                const planSelect = document.getElementById('payment-plan-select');
                if (planSelect) {
                    planSelect.value = memberPlan;
                    updateAmountFromPlan();
                }
            }
        });
    }
}
function populatePlanDropdown() {
    const select = document.getElementById('payment-plan-select');
    if (select) {
        select.innerHTML = allPlans.map(p => `
      <option value="${p.name}" data-price="${p.price}">${p.name} (₹${p.price.toLocaleString()})</option>
    `).join('');
        select.addEventListener('change', updateAmountFromPlan);
        updateAmountFromPlan();
    }
}
function updateAmountFromPlan() {
    const planSelect = document.getElementById('payment-plan-select');
    const amountInput = document.getElementById('payment-amount-input');
    if (planSelect && amountInput) {
        const selectedOption = planSelect.options[planSelect.selectedIndex];
        const price = selectedOption?.getAttribute('data-price');
        if (price) {
            amountInput.value = price;
        }
    }
}
export async function loadPayments() {
    const searchInput = document.getElementById('payments-search-input')?.value || '';
    const methodFilter = document.getElementById('payments-method-filter')?.value || 'all';
    const params = new URLSearchParams();
    if (searchInput)
        params.append('search', searchInput);
    if (methodFilter && methodFilter !== 'all')
        params.append('method', methodFilter);
    try {
        const res = await apiRequest(`/payments?${params.toString()}`);
        if (res.success) {
            allPayments = res.data;
            renderPaymentsTable(allPayments);
            const totalCollectedEl = document.getElementById('payments-total-collected');
            if (totalCollectedEl)
                totalCollectedEl.textContent = `₹${res.totalCollected.toLocaleString()}`;
            const countEl = document.getElementById('payments-count-badge');
            if (countEl)
                countEl.textContent = `${res.count} Transactions`;
        }
    }
    catch (err) {
        showToast('Failed to load payments: ' + err.message, 'error');
    }
}
function renderPaymentsTable(payments) {
    const tbody = document.getElementById('payments-table-tbody');
    if (!tbody)
        return;
    if (payments.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-outline-variant">
          <span class="material-symbols-outlined text-4xl mb-2">payments</span>
          <p class="text-sm">No payment records found.</p>
        </td>
      </tr>
    `;
        return;
    }
    tbody.innerHTML = payments.map(p => {
        const methodBadge = p.paymentMethod === 'UPI'
            ? '<span class="px-2 py-0.5 rounded text-xs font-bold bg-primary-container/20 text-primary">UPI</span>'
            : (p.paymentMethod === 'Card'
                ? '<span class="px-2 py-0.5 rounded text-xs font-bold bg-secondary-container/30 text-secondary">Card</span>'
                : '<span class="px-2 py-0.5 rounded text-xs font-bold bg-surface-container-highest text-on-surface">Cash</span>');
        return `
      <tr class="border-b border-surface-container-high/60 hover:bg-surface-container-high/30 transition-colors">
        <td class="py-3.5 px-4 font-mono text-xs text-primary font-bold">${p.id}</td>
        <td class="py-3.5 px-4">
          <div class="font-semibold text-sm text-on-surface">${p.memberName}</div>
          <div class="text-[11px] font-mono text-outline-variant">${p.memberId}</div>
        </td>
        <td class="py-3.5 px-4 text-xs font-medium text-on-surface">${p.membershipPlan}</td>
        <td class="py-3.5 px-4 font-metric-display text-sm font-bold text-on-surface">₹${p.amount.toLocaleString()}</td>
        <td class="py-3.5 px-4">${methodBadge}</td>
        <td class="py-3.5 px-4 text-xs text-outline-variant">${p.date}</td>
        <td class="py-3.5 px-4 text-right">
          <button class="px-3 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-xs font-semibold text-primary transition-colors inline-flex items-center gap-1" onclick="window.viewReceipt('${p.id}')">
            <span class="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Receipt</span>
          </button>
        </td>
      </tr>
    `;
    }).join('');
}
function setupEventListeners() {
    const form = document.getElementById('record-payment-form');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        try {
            const res = await apiRequest('/payments', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (res.success) {
                showToast(res.message, 'success');
                form.reset();
                window.closeRecordModal();
                await loadPayments();
                // Prompt for receipt
                window.viewReceipt(res.data.id);
            }
        }
        catch (err) {
            showToast(err.message || 'Failed to record payment', 'error');
        }
    });
    const searchInput = document.getElementById('payments-search-input');
    searchInput?.addEventListener('input', () => loadPayments());
    const methodFilter = document.getElementById('payments-method-filter');
    methodFilter?.addEventListener('change', () => loadPayments());
}
window.viewReceipt = async (id) => {
    try {
        const res = await apiRequest(`/payments/${id}/receipt`);
        if (res.success && res.receipt) {
            const r = res.receipt;
            const modal = document.getElementById('receipt-modal');
            const content = document.getElementById('receipt-modal-content');
            if (content) {
                content.innerHTML = `
          <div class="p-8 text-on-surface bg-surface-container rounded-2xl border border-surface-container-high print:p-0 print:border-none print:bg-white print:text-black">
            <!-- Header -->
            <div class="flex items-start justify-between border-b border-surface-container-high pb-6 mb-6">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-headline-lg text-2xl font-bold tracking-tight text-primary print:text-orange-600">⚡ FITZONE</span>
                  <span class="text-xs uppercase tracking-wider text-outline print:text-gray-500">GYM OS</span>
                </div>
                <div class="text-xs text-outline-variant print:text-gray-600">${r.gym.address}</div>
                <div class="text-xs text-outline-variant print:text-gray-600">Phone: ${r.gym.phone} | GSTIN: ${r.gym.gstin}</div>
              </div>
              <div class="text-right">
                <span class="px-3 py-1 rounded bg-primary-container/20 text-primary text-xs font-bold print:border print:border-orange-500">TAX INVOICE</span>
                <div class="text-xs font-mono font-bold text-on-surface mt-2 print:text-black">Inv #: ${r.receiptNumber}</div>
                <div class="text-xs text-outline-variant print:text-gray-500">Date: ${r.date}</div>
              </div>
            </div>

            <!-- Member Bill To -->
            <div class="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-high/60 mb-6 text-xs print:bg-gray-100 print:text-black">
              <div>
                <div class="text-outline uppercase text-[10px] font-bold mb-1 print:text-gray-500">BILLED TO (ATHLETE)</div>
                <div class="font-bold text-sm text-on-surface print:text-black">${r.member.name}</div>
                <div class="text-outline-variant print:text-gray-700">Member ID: ${r.member.id}</div>
                <div class="text-outline-variant print:text-gray-700">Phone: ${r.member.phone}</div>
              </div>
              <div class="text-right">
                <div class="text-outline uppercase text-[10px] font-bold mb-1 print:text-gray-500">PAYMENT DETAILS</div>
                <div class="font-semibold text-on-surface print:text-black">Mode: ${r.paymentMethod}</div>
                <div class="text-outline-variant print:text-gray-700 font-mono text-[11px]">${r.reference}</div>
                <div class="text-tertiary font-bold mt-1 print:text-green-600">Status: PAID / COMPLETED</div>
              </div>
            </div>

            <!-- Table -->
            <table class="w-full text-left text-xs mb-6">
              <thead>
                <tr class="border-b border-surface-container-high text-outline print:border-gray-300 print:text-gray-600">
                  <th class="py-2">Description</th>
                  <th class="py-2 text-right">Taxable Amount</th>
                  <th class="py-2 text-right">GST (18%)</th>
                  <th class="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${r.lineItems.map((li) => `
                  <tr class="border-b border-surface-container-high/40 print:border-gray-200">
                    <td class="py-3 font-semibold">${li.item}</td>
                    <td class="py-3 text-right">₹${li.baseAmount.toLocaleString()}</td>
                    <td class="py-3 text-right">₹${li.gstAmount.toLocaleString()}</td>
                    <td class="py-3 text-right font-bold text-primary print:text-black">₹${li.total.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Total Summary -->
            <div class="flex justify-end mb-8">
              <div class="w-64 space-y-2 text-xs">
                <div class="flex justify-between text-outline-variant print:text-gray-700">
                  <span>Subtotal:</span>
                  <span>₹${r.subTotal.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-outline-variant print:text-gray-700">
                  <span>CGST (9%) + SGST (9%):</span>
                  <span>₹${r.taxTotal.toLocaleString()}</span>
                </div>
                <div class="border-t border-surface-container-high pt-2 flex justify-between font-headline-sm text-base font-bold text-on-surface print:border-gray-300 print:text-black">
                  <span>Grand Total:</span>
                  <span class="text-primary print:text-black">₹${r.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <!-- Footer Stamp -->
            <div class="border-t border-surface-container-high pt-4 flex items-center justify-between text-[11px] text-outline-variant print:border-gray-300 print:text-gray-600">
              <div>Computer-generated digital receipt • FITZONE OS</div>
              <div class="text-right">Authorized Signatory: <span class="font-bold text-on-surface print:text-black">${r.authorizedBy}</span></div>
            </div>
          </div>
        `;
            }
            modal?.classList.remove('hidden');
        }
    }
    catch (err) {
        showToast('Failed to load receipt: ' + err.message, 'error');
    }
};
