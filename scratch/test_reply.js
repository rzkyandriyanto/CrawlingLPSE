async function testReply() {
  const res = await fetch('http://localhost:3000/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemId: "10140905000",
      itemType: "Barang",
      userId: "123",
      userName: "Agent",
      comment: "This is a test reply to gusti",
      parentId: "6a2484090d981090b9a2b01a"
    })
  });
  console.log(await res.json());
}
testReply();
