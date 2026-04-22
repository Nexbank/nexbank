const { selectedAccount, depositFunds } = useAccount();

const handleSubmit = async (event) => {
  event.preventDefault();

  if (!selectedAccount) {
    alert("Please select an account before making a deposit.");
    return;
  }

  if (!form.amount || Number(form.amount) <= 0) {
    alert("Please enter a valid deposit amount.");
    return;
  }

  try {
    setIsSubmitting(true);
    
    await depositFunds({
      amount: Number(form.amount),
      bankName: "Direct Deposit",         // adjust as needed
      source: "external",
      accountHolder: storedUser.firstname || "Account Holder",
      accountNumber: selectedAccount.accountNumber,
      reference: form.reference,
      transferSpeed: "standard",
    });

    alert("Deposit completed successfully.");
    navigate("/dashboard");
  } catch (error) {
    alert(error.message || "Deposit failed. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};