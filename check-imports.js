const React = require('react');
const lucide = require('lucide-react');
console.log('lucide.ReceiptText exists:', !!lucide.ReceiptText);
console.log('lucide.ShieldAlert exists:', !!lucide.ShieldAlert);
console.log('lucide.WifiOff exists:', !!lucide.WifiOff);
console.log('lucide.CloudOff exists:', !!lucide.CloudOff);
console.log('lucide.ListChecks exists:', !!lucide.ListChecks);
console.log('lucide.Stethoscope exists:', !!lucide.Stethoscope);
console.log('lucide.CreditCard exists:', !!lucide.CreditCard);

try {
  const dynamic = require('next/dynamic');
  console.log('next/dynamic exists:', !!dynamic);
} catch (e) {
  console.log('next/dynamic failed');
}

