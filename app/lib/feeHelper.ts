export interface FeeBreakdown {
  lateFee: number;
  extensionFee: number;
  damageFee: number;
  lossFee: number;
  totalFee: number;

  paidLateFee: number;
  paidExtensionFee: number;
  paidDamageFee: number;
  paidLossFee: number;
  totalPaidFee: number;

  unpaidLateFee: number;
  unpaidExtensionFee: number;
  unpaidDamageFee: number;
  unpaidLossFee: number;
  unpaidTotalFee: number;

  isAllFeesPaid: boolean;
  baseAmount: number;
}

export function calculateOrderFees(order: any): FeeBreakdown {
  const lateFee = Number(order.lateFee || 0);
  const extensionFee = Number(order.extensionFee || 0);
  const damageFee = Number(order.damageFee || 0);
  const lossFee = Number(order.lossFee || 0);
  const totalFee = lateFee + extensionFee + damageFee + lossFee;

  // Compute base rental amount from items
  let baseAmount = 0;
  if (Array.isArray(order.items) && order.items.length > 0) {
    baseAmount = order.items.reduce((sum: number, item: any) => {
      const price = Number(item.price || item.equipment?.pricePerDay || 0);
      const qty = Number(item.quantity || 1);
      const duration = Number(item.duration || 1);
      const subtotal = Number(item.subtotal || price * qty * duration);
      return sum + subtotal;
    }, 0);
  }
  if (baseAmount === 0 && order.totalAmount) {
    baseAmount = Math.max(0, Number(order.totalAmount) - totalFee);
  }

  // Parse notes for explicit paid details
  let parsedNotes: any = null;
  if (typeof order.notes === "string" && order.notes.trim().startsWith("{")) {
    try {
      parsedNotes = JSON.parse(order.notes);
    } catch {
      parsedNotes = null;
    }
  } else if (order.parsedNotes && typeof order.parsedNotes === "object") {
    parsedNotes = order.parsedNotes;
  }

  let paidLateFee = 0;
  let paidExtensionFee = 0;
  let paidDamageFee = 0;
  let paidLossFee = 0;

  const feeStatus = String(order.feeStatus || "NONE").toUpperCase();

  if (feeStatus === "PAID") {
    // If the overall fee status is marked PAID, all recorded fees are settled
    paidLateFee = lateFee;
    paidExtensionFee = extensionFee;
    paidDamageFee = damageFee;
    paidLossFee = lossFee;
  } else if (parsedNotes?.paidFeeDetails && typeof parsedNotes.paidFeeDetails === "object") {
    // Explicit paid details tracked in order notes
    const details = parsedNotes.paidFeeDetails;
    paidLateFee = Math.min(lateFee, Number(details.lateFee || 0));
    paidExtensionFee = Math.min(extensionFee, Number(details.extensionFee || 0));
    paidDamageFee = Math.min(damageFee, Number(details.damageFee || 0));
    paidLossFee = Math.min(lossFee, Number(details.lossFee || 0));
  } else {
    // Infer paid fees for existing/legacy orders
    // 1. Check confirmed payments
    const confirmedPayments = Array.isArray(order.payments)
      ? order.payments.filter((p: any) => p.status === "CONFIRMED")
      : [];

    let feePaymentsTotal = 0;
    if (confirmedPayments.length > 0) {
      const totalPaidConfirmed = confirmedPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      // Fee payments = total confirmed payments minus base rental amount
      feePaymentsTotal = Math.max(0, totalPaidConfirmed - baseAmount);
    } else if (order.totalAmount && baseAmount > 0 && order.totalAmount > baseAmount) {
      // In pay-fee, totalAmount was incremented by totalFee paid:
      feePaymentsTotal = Math.max(0, Number(order.totalAmount) - baseAmount);
    }

    // In rental lifecycle, extension fee is assessed & paid first during active rental.
    // Damage, late, and loss fees are assessed at the end during return inspection.
    if (feePaymentsTotal > 0 && extensionFee > 0) {
      paidExtensionFee = Math.min(extensionFee, feePaymentsTotal);
      feePaymentsTotal -= paidExtensionFee;
    }
    if (feePaymentsTotal > 0 && lateFee > 0) {
      paidLateFee = Math.min(lateFee, feePaymentsTotal);
      feePaymentsTotal -= paidLateFee;
    }
    if (feePaymentsTotal > 0 && damageFee > 0) {
      paidDamageFee = Math.min(damageFee, feePaymentsTotal);
      feePaymentsTotal -= paidDamageFee;
    }
    if (feePaymentsTotal > 0 && lossFee > 0) {
      paidLossFee = Math.min(lossFee, feePaymentsTotal);
      feePaymentsTotal -= paidLossFee;
    }
  }

  const unpaidLateFee = Math.max(0, lateFee - paidLateFee);
  const unpaidExtensionFee = Math.max(0, extensionFee - paidExtensionFee);
  const unpaidDamageFee = Math.max(0, damageFee - paidDamageFee);
  const unpaidLossFee = Math.max(0, lossFee - paidLossFee);
  const unpaidTotalFee = unpaidLateFee + unpaidExtensionFee + unpaidDamageFee + unpaidLossFee;
  const totalPaidFee = paidLateFee + paidExtensionFee + paidDamageFee + paidLossFee;
  const isAllFeesPaid = totalFee > 0 && unpaidTotalFee === 0;

  return {
    lateFee,
    extensionFee,
    damageFee,
    lossFee,
    totalFee,

    paidLateFee,
    paidExtensionFee,
    paidDamageFee,
    paidLossFee,
    totalPaidFee,

    unpaidLateFee,
    unpaidExtensionFee,
    unpaidDamageFee,
    unpaidLossFee,
    unpaidTotalFee,

    isAllFeesPaid,
    baseAmount,
  };
}
