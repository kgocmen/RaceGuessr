

# This file contains the settings for the project.
MAP = {
    1: "European",
    2: "MENA",
    3: "WACA",
    4: "EASEA",
    5: "Siberian",
    6: "American",
    7: "SAO",
    8: "SSA",
}

MATRIX = [
    [1,2,3,4,5,6,7,8], #default
    [2,3,5], #european -> mena,waca,siberian
    [1,3,7,8], #mena -> european,waca,sao,ssa
    [1,2,4,5,7], #waca -> european,mena,easea,siberian,sao
    [3,5,7], #easea -> waca,siberian,sao
    [1,3,4,6], #siberian -> european,waca,easea,american
    [5], #american -> siberian
    [2,3,4,8], #sao -> mena,waca,easea,ssa
    [2,7] #ssa -> mena,sao
]

SCORES = [100, 80, 70, 60, 50, 44, 38, 32, 26, 20]

REGIONS = [[1],[2,3,4],[5,6,7],[8]]

WEIGHTS = [12, 15, 18, 20, 24, 30, 40, 45]

TOTAL = 60

THRESHOLD = 0.90


TOP_K = 5

TEXTS = {
    "inv_name":"Invalid name. Please enter a valid name.",
    "inv_custom": "Invalid input. Please enter numbers between 1 and 9.",
    "inv_guess": "Invalid choice. Please enter a valid number.",
    "regions": "\n1.Single (1 Region)\n2.Multiple (2-4 Regions)\n3.Majority (5-7 Regions)\n4.Global (All Regions)\n5.Random (1-8 Regions)\n6.Custom (You Choose)",
    "custom": "1)European|2)Middle-East&North-African|3)West&Central-Asian|4)East&Southeast-Asian\n5)Siberian|6)American|7)South-Asian&Oceanian|8)Sub-Saharan-African\n9)Composite suggestions",
    "composite": "Composite suggestions:\nWhite(123)|Asian(345)|Bering(678)|Brown-Black(78)\nAfrica->Europe(1238)|Africa->Australia(278)|Africa->Americas(*-17)",
    "welcome": "\n🎮 Welcome to the Guess the Mix Game! 🎮\n",
    "guess": "\n🎯 Guess the Mix",
    "guess2": "\n🧑‍🤝‍🧑 Guesses",
    "points": "\n🏆 Points:",
    "results": "\n🏁 Closest 10 modern populations:",
    "mean": "❓ Did you mean:",
    "prompt": "Please select a number (or 0 to cancel):" 
}
