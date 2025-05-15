import round
import pandas as pd
import random
import settings
from tabulate import tabulate  # ensures formatting works

def get_player_names(num_players):
    player_names = []
    for i in range(num_players):
        while True:
            try:
                name = input(f"Player {i + 1}, Please enter your name: ").strip()
                if name:
                    break
            except:
                pass
            print(settings.TEXTS["inv_name"])
        player_names.append(name)
    return player_names


def get_round_regions(k=0):
    if k:
        if type(k)==list:
            return [settings.MAP[i] for i in k]
        else:
            choice = k
    else:
        print(settings.TEXTS["regions"])
        choice = int(input(f"Select Option: ").strip())
    region_list = []
    if 1 <= choice <= 4:
        regions = settings.REGIONS[choice-1]
        region_list = round.model_round(random.choice(regions))
    elif choice == 5:
        regions = random.choice(settings.REGIONS)
        region_list = round.model_round(random.choice(regions))
    elif choice == 6:
        region_list = round.custom_regions()
    elif not region_list:
        get_round_regions()
    return region_list


def play_game(dataframe, num_players, num_rounds, predata):
    print(settings.TEXTS["welcome"])
    player_names = get_player_names(num_players)

    # Initialize player names and zero scores
    player_cols = [f"{player_names[i]}" for i in range(num_players)]
    round_data = []

    # 🟢 Initial empty score table
    initial_df = pd.DataFrame(0, index=[f"Round {i+1}" for i in range(num_rounds)], columns=player_cols)
    initial_df.loc["Total"] = 0

    print(tabulate(initial_df, headers="keys", tablefmt="fancy_grid"))

    total_scores = [0 for _ in range(num_players)]

    for round_num in range(1, num_rounds + 1):
        # Select regions for the round
        print(f"\n===== ROUND {round_num} =====")

        try:
            region_list = get_round_regions(predata[round_num-1])
        except:
            region_list = get_round_regions()

        
            
        
        round_scores = round.run_round(dataframe, num_players, player_names,region_list)
        total_scores = [t + r for t, r in zip(total_scores, round_scores)]
        round_data.append(round_scores)

        # Update and show cumulative scores
        df = pd.DataFrame(round_data, columns=player_cols)
        df["Round"] = [f"Round {i+1}" for i in range(round_num)]
        df.set_index("Round", inplace=True)
        df.loc["Total"] = df.sum()
        print(f"\n=== END OF ROUND {round_num} ===\n")

        print(tabulate(df, headers="keys", tablefmt="fancy_grid"))

    # Final scores
    print("\n🎉 Final Scores:")
    for i, score in enumerate(total_scores):
        print(f"{player_names[i]}: {score} points")

    winner_index = total_scores.index(max(total_scores))
    print(f"\n🥇 Winner: {player_names[winner_index]}!")