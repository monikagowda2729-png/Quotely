import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { quotes, type Quote } from "../data/quotes";

const FAVORITES_KEY = "quotely_favorites";
const HISTORY_KEY = "quotely_history";
const THEME_KEY = "quotely_theme";

const categories = [
  "All",
  "Motivation",
  "Confidence",
  "Success",
  "Dreams",
  "Life",
  "Growth",
  "Wisdom",
];

export default function HomeScreen() {
  const [currentQuote, setCurrentQuote] = useState<Quote>(quotes[0]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [history, setHistory] = useState<Quote[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState("");

  const { quoteId } = useLocalSearchParams<{ quoteId?: string }>();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!quoteId) return;

    const foundQuote = quotes.find(
      (quote) => quote.id === Number(quoteId)
    );

    if (foundQuote) {
      setCurrentQuote(foundQuote);
    }
  }, [quoteId]);

  const loadData = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      const savedHistory = await AsyncStorage.getItem(HISTORY_KEY);
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);

      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }

      if (savedHistory) {
        const historyIds: number[] = JSON.parse(savedHistory);

        const historyQuotes = historyIds
          .map((id) => quotes.find((quote) => quote.id === id))
          .filter((quote): quote is Quote => quote !== undefined);

        setHistory(historyQuotes);
      }

      if (savedTheme) {
        setDarkMode(savedTheme === "dark");
      }
    } catch (error) {
      console.log("Error loading data:", error);
    }
  };

  const saveHistory = async (quote: Quote) => {
    try {
      const existingIds = history.map((item) => item.id);

      const newIds = [
        quote.id,
        ...existingIds.filter((id) => id !== quote.id),
      ].slice(0, 50);

      await AsyncStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(newIds)
      );

      const newHistory = newIds
        .map((id) => quotes.find((item) => item.id === id))
        .filter((item): item is Quote => item !== undefined);

      setHistory(newHistory);
    } catch (error) {
      console.log("Error saving history:", error);
    }
  };

  const toggleFavorite = async () => {
    try {
      let newFavorites: number[];

      if (favorites.includes(currentQuote.id)) {
        newFavorites = favorites.filter(
          (id) => id !== currentQuote.id
        );
        showMessage("Removed from favorites");
      } else {
        newFavorites = [...favorites, currentQuote.id];
        showMessage("Added to favorites ❤️");
      }

      setFavorites(newFavorites);

      await AsyncStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(newFavorites)
      );
    } catch (error) {
      console.log("Error updating favorite:", error);
    }
  };

  const showMessage = (text: string) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  const copyQuote = async () => {
    try {
      await Clipboard.setStringAsync(
        `"${currentQuote.text}" — ${currentQuote.author}`
      );

      showMessage("Quote copied 📋");
    } catch (error) {
      console.log("Copy error:", error);
    }
  };

  const shareQuote = async () => {
    try {
      await Share.share({
        message: `"${currentQuote.text}" — ${currentQuote.author}`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const changeQuote = (direction: "next" | "previous") => {
    const currentIndex = quotes.findIndex(
      (quote) => quote.id === currentQuote.id
    );

    let newIndex;

    if (direction === "next") {
      newIndex = (currentIndex + 1) % quotes.length;
    } else {
      newIndex =
        (currentIndex - 1 + quotes.length) % quotes.length;
    }

    const newQuote = quotes[newIndex];

    setCurrentQuote(newQuote);
    saveHistory(newQuote);
  };

  const selectQuote = (quote: Quote) => {
    setCurrentQuote(quote);
    saveHistory(quote);
  };

  const toggleTheme = async () => {
    const newMode = !darkMode;

    setDarkMode(newMode);

    try {
      await AsyncStorage.setItem(
        THEME_KEY,
        newMode ? "dark" : "light"
      );
    } catch (error) {
      console.log("Theme error:", error);
    }
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesCategory =
      selectedCategory === "All" ||
      quote.category === selectedCategory;

    const search = searchText.toLowerCase().trim();

    const matchesSearch =
      search === "" ||
      quote.text.toLowerCase().includes(search) ||
      quote.author.toLowerCase().includes(search) ||
      quote.category.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  const isFavorite = favorites.includes(currentQuote.id);

  const backgroundColor = darkMode ? "#121212" : "#F7F7F7";
  const cardColor = darkMode ? "#1E1E1E" : "#FFFFFF";
  const textColor = darkMode ? "#FFFFFF" : "#222222";
  const secondaryColor = darkMode ? "#BBBBBB" : "#666666";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.logo, { color: textColor }]}>
              Quotely ✨
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: secondaryColor },
              ]}
            >
              Discover. Save. Share. Inspire.
            </Text>
          </View>

          <Pressable
            onPress={toggleTheme}
            style={[
              styles.themeButton,
              { backgroundColor: cardColor },
            ]}
          >
            <Text style={styles.themeText}>
              {darkMode ? "☀️" : "🌙"}
            </Text>
          </Pressable>
        </View>

        {/* Message */}
        {message !== "" && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}

        {/* Main Quote Card */}
        <View
          style={[
            styles.quoteCard,
            { backgroundColor: cardColor },
          ]}
        >
          <Text
            style={[
              styles.quoteMark,
              { color: secondaryColor },
            ]}
          >
            “
          </Text>

          <Text style={[styles.quoteText, { color: textColor }]}>
            {currentQuote.text}
          </Text>

          <Text
            style={[
              styles.author,
              { color: secondaryColor },
            ]}
          >
            — {currentQuote.author}
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={toggleFavorite}
              style={styles.actionButton}
            >
              <Text style={styles.actionIcon}>
                {isFavorite ? "❤️" : "🤍"}
              </Text>

              <Text
                style={[
                  styles.actionText,
                  { color: textColor },
                ]}
              >
                Favorite
              </Text>
            </Pressable>

            <Pressable
              onPress={copyQuote}
              style={styles.actionButton}
            >
              <Text style={styles.actionIcon}>📋</Text>

              <Text
                style={[
                  styles.actionText,
                  { color: textColor },
                ]}
              >
                Copy
              </Text>
            </Pressable>

            <Pressable
              onPress={shareQuote}
              style={styles.actionButton}
            >
              <Text style={styles.actionIcon}>📤</Text>

              <Text
                style={[
                  styles.actionText,
                  { color: textColor },
                ]}
              >
                Share
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Previous / Next */}
        <View style={styles.navigationRow}>
          <Pressable
            onPress={() => changeQuote("previous")}
            style={styles.navigationButton}
          >
            <Text style={styles.navigationText}>
              ← Previous
            </Text>
          </Pressable>

          <Pressable
            onPress={() => changeQuote("next")}
            style={styles.navigationButton}
          >
            <Text style={styles.navigationText}>
              Next →
            </Text>
          </Pressable>
        </View>

        {/* History Button */}
        <Pressable
          onPress={() => router.push("/history")}
          style={styles.historyButton}
        >
          <Text style={styles.historyButtonText}>
            📜 View Quote History
          </Text>
        </Pressable>

        {/* Search */}
        <Text
          style={[
            styles.sectionTitle,
            { color: textColor },
          ]}
        >
          Explore Quotes
        </Text>

        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search quotes, authors..."
          placeholderTextColor={darkMode ? "#888888" : "#999999"}
          style={[
            styles.searchInput,
            {
              backgroundColor: cardColor,
              color: textColor,
            },
          ]}
        />

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {categories.map((category) => {
            const selected = selectedCategory === category;

            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selected
                      ? "#6C63FF"
                      : cardColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: selected
                        ? "#FFFFFF"
                        : textColor,
                    },
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quote List */}
        {filteredQuotes.slice(0, 10).map((quote) => (
          <Pressable
            key={quote.id}
            onPress={() => selectQuote(quote)}
            style={[
              styles.smallCard,
              { backgroundColor: cardColor },
            ]}
          >
            <Text
              style={[
                styles.smallQuote,
                { color: textColor },
              ]}
            >
              “{quote.text}”
            </Text>

            <Text
              style={[
                styles.smallAuthor,
                { color: secondaryColor },
              ]}
            >
              — {quote.author}
            </Text>

            <Text style={styles.categoryLabel}>
              {quote.category}
            </Text>
          </Pressable>
        ))}

        {filteredQuotes.length === 0 && (
          <View style={styles.emptyBox}>
            <Text
              style={[
                styles.emptyText,
                { color: secondaryColor },
              ]}
            >
              No quotes found.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  logo: {
    fontSize: 30,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },

  themeButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },

  themeText: {
    fontSize: 21,
  },

  messageBox: {
    backgroundColor: "#6C63FF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
  },

  messageText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  quoteCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 15,
    elevation: 3,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  quoteMark: {
    fontSize: 55,
    height: 55,
  },

  quoteText: {
    fontSize: 23,
    lineHeight: 34,
    fontWeight: "600",
    marginBottom: 18,
  },

  author: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 16,
  },

  actionButton: {
    alignItems: "center",
  },

  actionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },

  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },

  navigationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  navigationButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  navigationText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  historyButton: {
    backgroundColor: "#222222",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 25,
  },

  historyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 12,
  },

  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 15,
  },

  categoryScroll: {
    marginBottom: 15,
  },

  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
  },

  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },

  smallCard: {
    padding: 17,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 1,
  },

  smallQuote: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },

  smallAuthor: {
    fontSize: 13,
    marginTop: 8,
  },

  categoryLabel: {
    color: "#6C63FF",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
  },

  emptyBox: {
    padding: 30,
    alignItems: "center",
  },

  emptyText: {
    fontSize: 15,
  },
});