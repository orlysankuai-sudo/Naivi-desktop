const reply='我看着呢，感謝你的喜歡，愛來自Orly';
function easterEgg(text){const t=String(text).normalize('NFKC').trim().replace(/[\s!！。,.，~～💕❤️]/gu,'');return /^(?:(?:olry|orly|奧莉|奥莉)(?:\/|、)?)+(?:(?:真|太|好|超級|超级)?(?:牛逼|牛批|nb|厲害|厉害))+$/i.test(t)?reply:null;}
module.exports={easterEgg,reply};
