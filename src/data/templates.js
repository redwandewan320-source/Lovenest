const names = [
  ["Our Little World","Cute Love","🌸"],["Forever Yours","Anniversary","💗"],
  ["A Letter For You","Apology","💌"],["Happy Birthday Love","Birthday","🎂"],
  ["Will You Be Mine?","Proposal","💍"],["Miles Apart","Long Distance","🌙"],
  ["My Sunshine","Cute Love","☀️"],["Our Memories","Anniversary","📸"],
  ["Please Forgive Me","Apology","🥺"],["Birthday Princess","Birthday","🎀"],
  ["My Forever","Proposal","🌹"],["Until We Meet","Long Distance","✈️"],
  ["Sweet Love","Cute Love","🧸"],["Our Journey","Anniversary","❤️"],
  ["One More Chance","Apology","🫶"],["Your Special Day","Birthday","🎁"],
  ["The Big Question","Proposal","💝"],["Distance Can't Stop Us","Long Distance","💫"],
  ["Pink Paradise","Cute Love","🦋"],["365 Days Together","Anniversary","💐"],
  ["I'm Sorry My Love","Apology","🥀"],["Queen For A Day","Birthday","👑"],
  ["A Thousand Roses","Proposal","🌷"],["Across The Stars","Long Distance","⭐"],
  ["Love Story","Cute Love","💕"],["Our First Date","Anniversary","🍓"],
  ["Forgive My Heart","Apology","💗"],["Birthday Surprise","Birthday","🎉"],
  ["Forever Together","Proposal","💍"],["Waiting For You","Long Distance","🌍"]
];

export const templates = names.map((x, i) => ({
  id: `template-${i+1}`,
  title: x[0],
  category: x[1],
  emoji: x[2],
  config: {
    title: x[0],
    fromName: "Your Name",
    toName: "Someone Special",
    message: "You make ordinary moments feel magical. Thank you for being part of my story. ❤️",
    background: ["#fff0f5","#fce7f3","#fff1e8","#f4eaff"][i % 4],
    accent: "#d94f87",
    buttonText: "Open My Letter 💌"
  }
}));
                                       
